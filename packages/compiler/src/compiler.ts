import { TrustMode } from '@bos-web-engine/common';

import {
  buildComponentFunction,
  buildComponentFunctionName,
} from './component';
import {
  buildComponentImportStatements,
  buildModuleImports,
  buildModulePackageUrl,
  extractImportStatements,
} from './import';
import { parseChildComponents, ParsedChildComponent } from './parser';
import { fetchComponentSources } from './source';
import { transpileSource } from './transpile';
import type {
  CompilerExecuteAction,
  CompilerInitAction,
  ComponentCompilerParams,
  ComponentTreeNode,
  ParseComponentTreeParams,
  SendMessageCallback,
  TranspiledComponentLookupParams,
  TrustedRoot,
} from './types';

export class ComponentCompiler {
  private bosSourceCache: Map<string, Promise<string>>;
  private compiledSourceCache: Map<string, string | null>;
  private readonly sendWorkerMessage: SendMessageCallback;
  private hasFetchedLocal: boolean = false;
  private localFetchUrl?: string;
  private preactVersion?: string;

  constructor({ sendMessage }: ComponentCompilerParams) {
    this.bosSourceCache = new Map<string, Promise<string>>();
    this.compiledSourceCache = new Map<string, string>();
    this.sendWorkerMessage = sendMessage;
  }

  init({ localFetchUrl, preactVersion }: CompilerInitAction) {
    this.localFetchUrl = localFetchUrl;
    this.preactVersion = preactVersion;
  }

  getComponentSources(componentPaths: string[]) {
    const unfetchedPaths = componentPaths.filter(
      (componentPath) => !this.bosSourceCache.has(componentPath)
    );
    if (unfetchedPaths.length > 0) {
      const pathsFetch = fetchComponentSources(
        'https://rpc.near.org',
        unfetchedPaths
      );
      unfetchedPaths.forEach((componentPath) => {
        this.bosSourceCache.set(
          componentPath,
          pathsFetch
            .then((paths) => paths[componentPath])
            .catch((e) => console.error(e, { componentPath }))
        );
      });
    }

    const componentSources = new Map<string, Promise<string>>();
    componentPaths.forEach((componentPath) => {
      const componentSource = this.bosSourceCache.get(componentPath);
      if (componentSource) {
        componentSources.set(componentPath, componentSource);
      }
    });
    return componentSources;
  }

  getTranspiledComponentSource({
    componentPath,
    componentSource,
    isRoot,
  }: TranspiledComponentLookupParams) {
    const cacheKey = JSON.stringify({ componentPath, isRoot });
    if (!this.compiledSourceCache.has(cacheKey)) {
      try {
        const { code } = transpileSource(componentSource);
        this.compiledSourceCache.set(cacheKey, code || null);
      } catch (e) {
        console.error(`Failed to transpile ${componentPath}`, e);
        this.compiledSourceCache.set(cacheKey, null);
      }
    }

    return this.compiledSourceCache.get(cacheKey)!;
  }

  static isChildComponentTrusted(
    { trustMode, path }: ParsedChildComponent,
    isComponentPathTrusted?: (p: string) => boolean
  ) {
    if (
      trustMode === TrustMode.Trusted ||
      trustMode === TrustMode.TrustAuthor
    ) {
      return true;
    }

    if (trustMode === TrustMode.Sandboxed) {
      return false;
    }

    // if the Component is not explicitly trusted or sandboxed, use the parent's
    // predicate to determine whether the Component should be trusted
    if (isComponentPathTrusted) {
      return isComponentPathTrusted(path);
    }

    return false;
  }

  /**
   * Traverse the Component tree, building the set of Components to be included within the container
   * @param componentPath the path to the root Component of the current tree
   * @param transpiledComponent transpiled JSX source code
   * @param components set of Components accumulated while traversing the Component tree
   * @param isComponentPathTrusted callback to determine whether the current Component is to be trusted in the container
   * @param isRoot flag indicating whether the current Component is the container root
   * @param trustedRoot the trust mode inherited by the current Component from an ancestor Component (e.g. that extends trust to all child Components of the same author)
   */
  async parseComponentTree({
    componentPath,
    componentSource,
    components,
    isComponentPathTrusted,
    isRoot,
    trustedRoot,
  }: ParseComponentTreeParams) {
    // separate out import statements from Component source
    const { imports, source: cleanComponentSource } =
      extractImportStatements(componentSource);

    const componentImports = imports
      .map((moduleImport) => buildComponentImportStatements(moduleImport))
      .flat()
      .filter((statement) => !!statement) as string[];

    // wrap the Component's JSX body source in a function to be rendered as a Component
    const componentFunctionSource = buildComponentFunction({
      componentPath,
      componentSource: cleanComponentSource,
      componentImports,
      isRoot,
    });

    // transpile and cache the Component
    const transpiledComponent = this.getTranspiledComponentSource({
      componentPath,
      componentSource: componentFunctionSource,
      isRoot,
    });

    // enumerate the set of Components referenced in the target Component
    const childComponents = parseChildComponents(transpiledComponent);

    // each child Component being rendered as a new trusted root (i.e. trust mode `trusted-author`)
    // will track inclusion criteria when evaluating trust for their children in turn
    const buildTrustedRootKey = ({ index, path }: ParsedChildComponent) =>
      `${index}:${path}`;

    const trustedRoots = childComponents.reduce((trusted, childComponent) => {
      const { trustMode } = childComponent;

      // trust Components with the same author as the trusted root Component
      if (trustMode === TrustMode.TrustAuthor) {
        const rootComponentAuthor = componentPath.split('/')[0];
        trusted.set(buildTrustedRootKey(childComponent), {
          rootPath: componentPath,
          trustMode,
          matchesRootAuthor: (path: string) =>
            path.split('/')[0] === rootComponentAuthor,
        });
      }

      return trusted;
    }, new Map<string, TrustedRoot>());

    // get the set of trusted child Components to be inlined in the container
    const trustedChildComponents = childComponents.filter((child) =>
      ComponentCompiler.isChildComponentTrusted(child, isComponentPathTrusted)
    );

    // add the transformed source to the returned Component tree
    components.set(componentPath, {
      imports,
      // replace each child [Component] reference in the target Component source
      // with the generated name of the inlined Component function definition
      transpiled: trustedChildComponents.reduce(
        (transformed, { path, transform }) =>
          transform(transformed, buildComponentFunctionName(path)),
        transpiledComponent
      ),
    });

    // fetch the set of child Component sources not already added to the tree
    const childComponentSources = this.getComponentSources(
      trustedChildComponents
        .map(({ path }) => path)
        .filter((path) => !(path in components))
    );

    // transpile the set of new child Components and recursively parse their Component subtrees
    await Promise.all(
      trustedChildComponents.map(async (childComponent) => {
        const { path } = childComponent;
        const componentSource = (await childComponentSources.get(path))!;

        const childTrustedRoot =
          trustedRoots.get(buildTrustedRootKey(childComponent)) || trustedRoot;

        await this.parseComponentTree({
          componentPath: path,
          componentSource,
          components,
          trustedRoot: childTrustedRoot,
          isRoot: false,
          isComponentPathTrusted:
            trustedRoot?.trustMode === TrustMode.Sandboxed
              ? undefined
              : () => {
                  if (childTrustedRoot?.trustMode === TrustMode.TrustAuthor) {
                    return !!childTrustedRoot?.matchesRootAuthor(path);
                  }
                  return false;
                },
        });
      })
    );

    return components;
  }

  async compileComponent({ componentId }: CompilerExecuteAction) {
    if (this.localFetchUrl && !this.hasFetchedLocal) {
      try {
        await this.fetchLocalComponents();
      } catch (e) {
        console.error('Failed to fetch local components', e);
      }
      this.hasFetchedLocal = true;
    }

    const componentPath = componentId.split('##')[0];
    const source = await this.getComponentSources([componentPath]).get(
      componentPath
    );
    if (!source) {
      throw new Error(`Component not found at ${componentPath}`);
    }

    // recursively parse the Component tree for child Components
    const transformedComponents = await this.parseComponentTree({
      componentPath,
      componentSource: source,
      components: new Map<string, ComponentTreeNode>(),
      isRoot: true,
    });

    const containerModuleImports = [...transformedComponents.values()]
      .map(({ imports }) => imports)
      .flat();

    const importedModules = containerModuleImports.reduce(
      (importMap, { moduleName, modulePath }) => {
        const importMapEntries = buildModulePackageUrl(
          moduleName,
          modulePath,
          this.preactVersion!
        );

        if (!importMapEntries) {
          return importMap;
        }

        const moduleEntry = importMap.get(moduleName);
        if (moduleEntry) {
          return importMap;
        }

        importMap.set(importMapEntries.moduleName, importMapEntries.url);
        return importMap;
      },
      new Map<string, string>()
    );

    const componentSource = [
      ...buildModuleImports(containerModuleImports),
      ...[...transformedComponents.values()].map(
        ({ transpiled }) => transpiled
      ),
    ].join('\n\n');

    this.sendWorkerMessage({
      componentId,
      componentSource,
      rawSource: source,
      componentPath,
      importedModules,
    });
  }

  /**
   * Fetch local component source from a bos-loader instance
   */
  async fetchLocalComponents() {
    if (!this.localFetchUrl) {
      return;
    }

    const res = await fetch(this.localFetchUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Network response was not OK');
    }

    const data = (await res.json()) as {
      components: Record<string, { code: string }>;
    };
    for (const [componentPath, componentSource] of Object.entries(
      data.components
    )) {
      this.bosSourceCache.set(
        componentPath,
        Promise.resolve(componentSource.code)
      );
    }
  }
}

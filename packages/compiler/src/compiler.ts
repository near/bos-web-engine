import { TrustMode } from '@bos-web-engine/common';

import {
  buildComponentFunction,
  buildComponentFunctionName,
} from './component';
import { extractExport } from './export';
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
  CompilerSetLocalComponentAction,
  ComponentCompilerParams,
  ComponentTreeNode,
  ModuleImport,
  ParseComponentTreeParams,
  SendMessageCallback,
  TranspiledComponentLookupParams,
  TrustedRoot,
} from './types';

interface BuildComponentSourceParams {
  componentPath: string;
  componentSource: string;
  isRoot: boolean;
}

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

  /**
   * Build the transpiled source of a BOS Component along with its imports
   * @param componentPath path to the BOS Component
   * @param componentSource source code of the BOS Component
   * @param isRoot flag indicating whether this is the root Component of a container
   */
  buildComponentSource({
    componentPath,
    componentSource,
    isRoot,
  }: BuildComponentSourceParams): { imports: ModuleImport[]; source: string } {
    // transpile and cache the Component
    const transpiledComponentSource = this.getTranspiledComponentSource({
      componentPath,
      componentSource: componentSource,
      isRoot,
    });

    // separate out import statements from Component source
    const { imports, source: importlessSource } = extractImportStatements(
      transpiledComponentSource
    );

    // get the exported reference's name and remove the export keyword(s) from Component source
    // TODO halt parsing of the current Component if no export is found
    const {
      exportedReference,
      hasExport,
      source: cleanComponentSource,
    } = extractExport(importlessSource);

    if (!hasExport) {
      throw new Error(
        `Could not parse Component ${componentPath}: missing valid Component export`
      );
    }

    const componentImports = imports
      .map((moduleImport) => buildComponentImportStatements(moduleImport))
      .flat()
      .filter((statement) => !!statement) as string[];

    // assign a known alias to the exported Component
    const source = buildComponentFunction({
      componentPath,
      componentSource: cleanComponentSource,
      componentImports,
      exportedReference,
      isRoot,
    });

    return {
      imports,
      source,
    };
  }

  /**
   * Fetch and cache sources for an array of Component paths
   * If a requested path has not been cached, initialize a Promise to resolve the source
   * @param componentPaths set of Component paths to fetch source for
   */
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

  /**
   * Transpile the component and cache for future lookups
   * @param componentPath path to the BOS Component
   * @param componentSource source code of the BOS Component
   * @param isRoot flag indicating whether this is the root Component of a container
   */
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

  /**
   * Determine whether a child Component is trusted and can be inlined within the current container
   * @param trustMode explicit trust mode provided for this child render
   * @param path child Component's path
   * @param isComponentPathTrusted flag indicating whether the child is implicitly trusted by virtue of being under a trusted root
   */
  static isChildComponentTrusted(
    { trustMode, path }: ParsedChildComponent,
    isComponentPathTrusted?: (p: string) => boolean
  ) {
    // child is explicitly trusted by parent or constitutes a new trusted root
    if (
      trustMode === TrustMode.Trusted ||
      trustMode === TrustMode.TrustAuthor
    ) {
      return true;
    }

    // child is explicitly sandboxed
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
    const { imports, source: componentFunctionSource } =
      this.buildComponentSource({
        componentPath,
        componentSource,
        isRoot,
      });

    // enumerate the set of Components referenced in the target Component
    const childComponents = parseChildComponents(componentFunctionSource);

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
        componentFunctionSource
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

  /**
   * Build the source for a container rooted at the target Component
   * @param componentId ID for the new container's root Component
   */
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

    // build the import map used by the container
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

  setLocalComponents({
    components,
    rootComponentPath,
  }: CompilerSetLocalComponentAction) {
    // TODO: Implement separated cache layers

    this.bosSourceCache.clear();
    this.compiledSourceCache.clear();

    components.forEach(({ componentPath, componentSource }) => {
      this.bosSourceCache.set(componentPath, Promise.resolve(componentSource));
    });

    this.compileComponent({
      action: 'execute',
      componentId: rootComponentPath,
    });
  }
}

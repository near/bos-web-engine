import { BOSModule, TrustMode } from '@bos-web-engine/common';
import { SocialDb } from '@bos-web-engine/social-db';

import {
  buildComponentSource,
  buildComponentFunctionName,
  isChildComponentTrusted,
} from './component';
import { buildModuleImports, buildModulePackageUrl } from './import';
import { ParsedChildComponent } from './parser';
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
} from './types';
import { TrustedRoot } from './types';

export class ComponentCompiler {
  private bosSourceCache: Map<string, Promise<BOSModule | null>>;
  private compiledSourceCache: Map<string, string | null>;
  private readonly sendWorkerMessage: SendMessageCallback;
  private hasFetchedLocal: boolean = false;
  private localFetchUrl?: string;
  private preactVersion?: string;
  private social: SocialDb;

  constructor({ sendMessage }: ComponentCompilerParams) {
    this.bosSourceCache = new Map<string, Promise<BOSModule>>();
    this.compiledSourceCache = new Map<string, string>();
    this.sendWorkerMessage = sendMessage;
    this.social = new SocialDb({
      debug: true, // TODO: Conditionally enable "debug" option
      networkId: 'mainnet', // TODO: Handle dynamically pass testnet vs mainnet
    });
  }

  init({ localComponents, localFetchUrl, preactVersion }: CompilerInitAction) {
    this.localFetchUrl = localFetchUrl;
    this.preactVersion = preactVersion;

    this.bosSourceCache.clear();
    this.compiledSourceCache.clear();

    Object.entries(localComponents || {}).forEach(([path, component]) => {
      this.bosSourceCache.set(path, Promise.resolve(component));
    });
  }

  /**
   * Fetch and cache sources for an array of Component paths
   * If a requested path has not been cached, initialize a Promise to resolve the source
   * @param componentPaths set of Component paths to fetch source for
   */
  getComponentSources(
    componentPaths: string[]
  ): Map<string, Promise<BOSModule | null>> {
    const unfetchedPaths = componentPaths.filter(
      (componentPath) => !this.bosSourceCache.has(componentPath)
    );
    if (unfetchedPaths.length > 0) {
      const pathsFetch = fetchComponentSources(this.social, unfetchedPaths);
      unfetchedPaths.forEach((componentPath) => {
        this.bosSourceCache.set(
          componentPath,
          pathsFetch
            .then((paths) => paths[componentPath])
            .catch((e) => {
              console.error(e, { componentPath });
              return null;
            })
        );
      });
    }

    const componentSources = new Map<string, Promise<BOSModule | null>>();
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
    componentStyles,
    components,
    isComponentPathTrusted,
    isRoot,
    trustedRoot,
  }: ParseComponentTreeParams) {
    // transpile and cache the Component
    const transpiledComponentSource = this.getTranspiledComponentSource({
      componentPath,
      componentSource,
      isRoot,
    });

    const {
      css: componentCss,
      childComponents,
      packageImports,
      source: componentFunctionSource,
    } = buildComponentSource({
      componentPath,
      componentStyles,
      isRoot,
      transpiledComponentSource,
    });

    // get the set of trusted child Components to be inlined in the container
    const trustedChildComponents = childComponents.filter((child) =>
      isChildComponentTrusted(child, isComponentPathTrusted)
    );

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

    // add the transformed source to the returned Component tree
    components.set(componentPath, {
      css: componentCss,
      imports: packageImports,
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
        const componentModule = (await childComponentSources.get(path))!;
        if (!componentModule) {
          return null;
        }

        const childTrustedRoot =
          trustedRoots.get(buildTrustedRootKey(childComponent)) || trustedRoot;

        await this.parseComponentTree({
          componentPath: path,
          componentSource: componentModule.component,
          componentStyles: componentModule.css,
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
    const moduleEntry = await this.getComponentSources([componentPath]).get(
      componentPath
    );

    if (!moduleEntry) {
      throw new Error(`Component not found at ${componentPath}`);
    }

    // recursively parse the Component tree for child Components
    const transformedComponents = await this.parseComponentTree({
      componentPath,
      componentSource: moduleEntry.component,
      componentStyles: moduleEntry.css,
      components: new Map<string, ComponentTreeNode>(),
      isRoot: true,
    });

    const aggregatedStyles = [...transformedComponents.entries()].reduce(
      (styleSheet, [path, { css }], i) => {
        if (!css) {
          return styleSheet;
        }

        // don't specify a selector the root Component CSS
        // it will be under the container's id in the aggregated CSS
        if (i === 0) {
          return css;
        }

        return `
${styleSheet}

[data-component-src="${path}"] {
  ${css}
}
`;
      },
      ''
    );

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

    const containerStyles = `
#dom-${componentId.replace(/([\/.#])/g, '\\$1')} {
  ${aggregatedStyles}
}`;

    this.sendWorkerMessage({
      componentId,
      componentSource,
      containerStyles,
      rawSource: moduleEntry.component,
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
      components: Record<string, BOSModule>;
    };
    for (const [componentPath, componentSource] of Object.entries(
      data.components
    )) {
      // TODO remove once data is being returned in expected shape
      // @ts-expect-error
      const { code: component } = componentSource;
      this.bosSourceCache.set(componentPath, Promise.resolve({ component }));
    }
  }
}

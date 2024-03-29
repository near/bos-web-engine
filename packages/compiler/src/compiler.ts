import { BOSModule, TrustMode } from '@bos-web-engine/common';
import { SocialDb } from '@bos-web-engine/social-db';

import {
  cacheComponentTreeDetails,
  retrieveComponentTreeDetailFromCache,
} from './cache';
import { buildComponentSource } from './component';
import { CssParser } from './css';
import { buildModuleImports, buildModulePackageUrl } from './import';
import { fetchComponentSources } from './source';
import { transpileSource } from './transpile';
import type {
  CompilerExecuteAction,
  CompilerInitAction,
  ComponentCompilerParams,
  ComponentTreeNode,
  ModuleExport,
  ModuleImport,
  ParseComponentTreeParams,
  SendMessageCallback,
  TranspiledComponentLookupParams,
  TrustedRoot,
} from './types';

interface TranspiledCacheEntry {
  children: { isTrusted: boolean; path: string; trustMode: string }[];
  exports: ModuleExport;
  imports: ModuleImport[];
  source: string;
}

export class ComponentCompiler {
  private bosSourceCache: Map<string, Promise<BOSModule | null>>;
  private localComponents: Map<string, boolean>;
  private compiledSourceCache: Map<string, TranspiledCacheEntry | null>;
  private readonly sendWorkerMessage: SendMessageCallback;
  private preactVersion?: string;
  private enableBlockHeightVersioning?: boolean;
  private enablePersistentComponentCache?: boolean;
  private social: SocialDb;
  private readonly cssParser: CssParser;

  constructor({ sendMessage }: ComponentCompilerParams) {
    this.bosSourceCache = new Map<string, Promise<BOSModule>>();
    this.localComponents = new Map<string, boolean>();
    this.compiledSourceCache = new Map<string, TranspiledCacheEntry>();
    this.cssParser = new CssParser();
    this.sendWorkerMessage = sendMessage;
    this.social = new SocialDb({
      debug: true, // TODO: Conditionally enable "debug" option
      networkId: 'mainnet', // TODO: Handle dynamically pass testnet vs mainnet
    });
  }

  init({
    localComponents,
    preactVersion,
    features: { enableBlockHeightVersioning, enablePersistentComponentCache },
  }: CompilerInitAction) {
    this.preactVersion = preactVersion;
    this.enableBlockHeightVersioning = enableBlockHeightVersioning;
    this.enablePersistentComponentCache = enablePersistentComponentCache;

    this.bosSourceCache.clear();
    this.localComponents.clear();
    this.compiledSourceCache.clear();

    Object.entries(localComponents || {}).forEach(([path, component]) => {
      this.bosSourceCache.set(path, Promise.resolve(component));
      this.localComponents.set(path, true);
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
      const pathsFetch = fetchComponentSources({
        social: this.social,
        componentPaths: unfetchedPaths,
        features: {
          enableBlockHeightVersioning: this.enableBlockHeightVersioning,
          enablePersistentComponentCache: this.enablePersistentComponentCache,
        },
      });
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
   * @param isComponentPathTrusted function to determine whether a child Component is rendered in a trusted context
   * @param isRoot flag indicating whether this is the root Component of a container
   */
  getTranspiledComponentSource({
    componentPath,
    componentSource,
    isComponentPathTrusted,
    isRoot,
  }: TranspiledComponentLookupParams) {
    const cacheKey = JSON.stringify({ componentPath, isRoot });
    if (!this.compiledSourceCache.has(cacheKey)) {
      try {
        const { children, code, exports, imports } = transpileSource({
          componentPath,
          source: componentSource,
          isComponentPathTrusted,
        });
        this.compiledSourceCache.set(
          cacheKey,
          code ? { children, exports, imports, source: code } : null
        );
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
    const {
      children,
      exports,
      imports,
      source: transpiledComponentSource,
    } = this.getTranspiledComponentSource({
      componentPath,
      componentSource,
      isComponentPathTrusted: isComponentPathTrusted || (() => false),
      isRoot,
    });

    const packageImports = imports.filter(({ isPackage }) => isPackage);
    const { css: componentCss, source: componentFunctionSource } =
      buildComponentSource({
        componentPath,
        componentStyles,
        cssParser: this.cssParser,
        exports,
        imports,
        isRoot,
        transpiledComponentSource,
      });

    // get the set of trusted child Components to be inlined in the container
    const trustedChildComponents = children.filter(
      ({ isTrusted }) => isTrusted
    );

    const trustedRoots = children.reduce((trusted, { path, trustMode }) => {
      // trust Components with the same author as the trusted root Component
      if (trustMode === TrustMode.TrustAuthor) {
        const rootComponentAuthor = componentPath.split('/')[0];
        trusted.set(path, {
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
      transpiled: componentFunctionSource,
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
          trustedRoots.get(childComponent.path) || trustedRoot;

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
    // wait on CSS initialization
    await this.cssParser.init();

    let [componentPath] = componentId.split('##');
    const [componentPathWithoutBlockHeight, blockHeight] =
      componentPath.split('@');
    if (blockHeight && !this.enableBlockHeightVersioning) {
      console.warn(
        `${componentPath} has a block height specified, but the "enableBlockHeightVersioning" flag is disabled. The latest version of Component will be used.`
      );
      componentPath = componentPathWithoutBlockHeight;
    }
    const moduleEntry = await this.getComponentSources([componentPath]).get(
      componentPath
    );

    if (!moduleEntry) {
      throw new Error(`Component not found at ${componentPath}`);
    }

    const isLocalComponent = this.localComponents.get(componentPath);
    const componentCacheKey = `${componentPathWithoutBlockHeight}@${moduleEntry?.blockHeight}`;
    if (
      this.enablePersistentComponentCache &&
      !isLocalComponent
    ) {
      const retrievedData =
        await retrieveComponentTreeDetailFromCache(componentCacheKey);
      if (retrievedData) {
        this.sendWorkerMessage({
          componentId,
          componentSource: retrievedData.componentSource,
          containerStyles: retrievedData.containerStyles,
          rawSource: moduleEntry.component,
          componentPath,
          importedModules: retrievedData.importedModules,
        });

        return;
      }
    }

    // recursively parse the Component tree for child Components
    const transformedComponents = await this.parseComponentTree({
      componentPath,
      componentSource: moduleEntry.component,
      componentStyles: moduleEntry.css,
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

    // escape "</script>" literals to prevent interpolation issues
    const sanitizedSource = componentSource.replaceAll(
      /<\/script\s*>/g,
      '<\\/script>'
    );

    const containerStyles = [...transformedComponents.values()]
      .map(({ css }) => css)
      .join('\n');

    if (this.enablePersistentComponentCache && !isLocalComponent) {
      await cacheComponentTreeDetails({
        key: componentCacheKey,
        componentSource,
        containerStyles,
        importedModules,
      });
    }

    this.sendWorkerMessage({
      componentId,
      componentSource: sanitizedSource,
      containerStyles,
      rawSource: moduleEntry.component,
      componentPath,
      importedModules,
    });
  }
}

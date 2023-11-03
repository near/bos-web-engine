import { TrustMode } from '@bos-web-engine/common';

import {
  buildComponentFunction,
  buildComponentFunctionName,
} from './component';
import { parseChildComponents, ParsedChildComponent } from './parser';
import { fetchComponentSources } from './source';
import { initPromise, transpileSource } from './transpile';

export type ComponentCompilerRequest =
  | CompilerExecuteAction
  | CompilerInitAction;

interface CompilerExecuteAction {
  action: 'execute';
  componentId: string;
}

interface CompilerInitAction {
  action: 'init';
  localFetchUrl?: string;
}

export interface ComponentCompilerResponse {
  componentId: string;
  componentSource: string;
  rawSource: string;
  componentPath: string;
  error?: Error;
}

type SendMessageCallback = (res: ComponentCompilerResponse) => void;

interface ComponentCompilerParams {
  sendMessage: SendMessageCallback;
}

interface TranspiledComponentLookupParams {
  componentPath: string;
  componentSource: string;
  isRoot: boolean;
}

interface ParseComponentTreeParams {
  mapped: { [key: string]: { transpiled: string } };
  transpiledComponent: string;
  componentPath: string;
  isComponentPathTrusted?: (path: string) => boolean;
  trustedRoot?: TrustedRoot;
}

interface TrustedRoot {
  rootPath: string;
  trustMode: string;
  /* predicates for determining trust under a trusted root */
  matchesRootAuthor: (path: string) => boolean;
}

export class ComponentCompiler {
  private bosSourceCache: Map<string, Promise<string>>;
  private compiledSourceCache: Map<string, string | null>;
  private readonly sendWorkerMessage: SendMessageCallback;
  private hasFetchedLocal: boolean = false;
  private localFetchUrl?: string;

  constructor({ sendMessage }: ComponentCompilerParams) {
    this.bosSourceCache = new Map<string, Promise<string>>();
    this.compiledSourceCache = new Map<string, string>();
    this.sendWorkerMessage = sendMessage;
  }

  init({ localFetchUrl }: CompilerInitAction) {
    this.localFetchUrl = localFetchUrl;
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
        console.time(`transpile:${componentPath}`);
        const { code } = transpileSource(componentSource);
        console.timeEnd(`transpile:${componentPath}`);
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

  async parseComponentTree({
    componentPath,
    transpiledComponent,
    mapped,
    isComponentPathTrusted,
    trustedRoot,
  }: ParseComponentTreeParams) {
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

    const trustedChildComponents = childComponents.filter((child) =>
      ComponentCompiler.isChildComponentTrusted(child, isComponentPathTrusted)
    );

    // add the transformed source to the returned Component tree
    mapped[componentPath] = {
      // replace each child [Component] reference in the target Component source
      // with the generated name of the inlined Component function definition
      transpiled: trustedChildComponents.reduce(
        (transformed, { path, transform }) =>
          transform(transformed, buildComponentFunctionName(path)),
        transpiledComponent
      ),
    };

    // fetch the set of child Component sources not already added to the tree
    const childComponentSources = this.getComponentSources(
      trustedChildComponents
        .map(({ path }) => path)
        .filter((path) => !(path in mapped))
    );

    // transpile the set of new child Components and recursively parse their Component subtrees
    await Promise.all(
      trustedChildComponents.map(async (childComponent) => {
        const { path } = childComponent;
        let transpiledChild = mapped[path]?.transpiled;
        if (!transpiledChild) {
          transpiledChild = this.getTranspiledComponentSource({
            componentPath: path,
            componentSource: buildComponentFunction({
              componentPath: path,
              componentSource: (await childComponentSources.get(path))!,
              isRoot: false,
            }),
            isRoot: false,
          });
        }

        const childTrustedRoot =
          trustedRoots.get(buildTrustedRootKey(childComponent)) || trustedRoot;

        await this.parseComponentTree({
          componentPath: path,
          transpiledComponent: transpiledChild,
          mapped,
          trustedRoot: childTrustedRoot,
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

    return mapped;
  }

  async compileComponent({ componentId }: CompilerExecuteAction) {
    // ! UNCOMMENT THIS BLOCK TO USE SWC
    // initialize transpiler
    try {
      console.time('initTranspiler');
      await initPromise;
      console.timeEnd('initTranspiler');
    } catch (e) {
      console.error('Failed to initialize transpiler', e);
    }

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

    const componentFunctionSource = buildComponentFunction({
      componentPath,
      componentSource: source,
      isRoot: true,
    });
    const transpiledComponent = this.getTranspiledComponentSource({
      componentPath,
      componentSource: componentFunctionSource,
      isRoot: true,
    });

    let componentSource = transpiledComponent;
    // recursively parse the Component tree for child Components
    const transformedComponents = await this.parseComponentTree({
      componentPath,
      transpiledComponent,
      mapped: {},
    });

    const [rootComponent, ...childComponents] = Object.values(
      transformedComponents
    ).map(({ transpiled }) => transpiled);
    const aggregatedSourceLines = rootComponent.split('\n');
    aggregatedSourceLines.splice(1, 0, childComponents.join('\n\n'));
    componentSource = aggregatedSourceLines.join('\n');

    this.sendWorkerMessage({
      componentId,
      componentSource,
      rawSource: source,
      componentPath,
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

import { buildComponentFunction, buildComponentFunctionName } from './component';
import { parseChildComponentPaths } from './parser';
import { fetchComponentSources } from './source';
import { transpileSource } from './transpile';

export interface ComponentCompilerRequest {
  componentId: string;
  isTrusted: boolean;
}

export interface ComponentCompilerResponse {
  componentId: string;
  componentSource: string;
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
}

export class ComponentCompiler {
  private bosSourceCache: Map<string, Promise<string>>;
  private compiledSourceCache: Map<string, string | null>;
  private readonly sendWorkerMessage: SendMessageCallback;

  constructor({ sendMessage }: ComponentCompilerParams) {
    this.bosSourceCache = new Map<string, Promise<string>>();
    this.compiledSourceCache = new Map<string, string>();
    this.sendWorkerMessage = sendMessage;
  }

  getComponentSources(componentPaths: string[]) {
    const unfetchedPaths = componentPaths.filter((componentPath) => !this.bosSourceCache.has(componentPath));
    if (unfetchedPaths.length > 0) {
      const pathsFetch = fetchComponentSources('https://rpc.near.org', unfetchedPaths);
      unfetchedPaths.forEach((componentPath) => {
        this.bosSourceCache.set(
          componentPath,
          pathsFetch.then((paths) => paths[componentPath])
            .catch((e) => console.error(e, { componentPath }))
        );
      });
    }

    return componentPaths.reduce((sources, componentPath) => {
      const componentSource = this.bosSourceCache.get(componentPath);
      if (componentSource) {
        sources.set(componentPath, componentSource);
      }

      return sources;
    }, new Map<string, Promise<string>>());
  }

  getTranspiledComponentSource({ componentPath, componentSource, isRoot }: TranspiledComponentLookupParams) {
    const cacheKey = JSON.stringify({ componentPath, isRoot });
    if (!this.compiledSourceCache.has(cacheKey)) {
      try {
        const { code } = transpileSource(componentSource);
        this.compiledSourceCache.set(cacheKey, code);
      } catch (e) {
        console.error(`Failed to transpile ${componentPath}`, e);
        this.compiledSourceCache.set(cacheKey, null);
      }
    }

    return this.compiledSourceCache.get(cacheKey)!;
  }

  async parseComponentTree({
    componentPath,
    transpiledComponent,
    mapped,
  }: ParseComponentTreeParams) {
    // enumerate the set of Components referenced in the target Component
    const childComponentPaths = parseChildComponentPaths(transpiledComponent);
    let transformedComponent = transpiledComponent;

    // replace each child [Component] reference in the target Component source
    // with the generated name of the inlined Component function definition
    childComponentPaths.forEach(({ source, transform }) => {
      transformedComponent = transform(transformedComponent, buildComponentFunctionName(source));
    });

    // add the transformed source to the returned Component tree
    mapped[componentPath] = {
      transpiled: transformedComponent,
    };

    // fetch the set of child Component sources not already added to the tree
    const childComponentSources = this.getComponentSources(
      childComponentPaths.map(({ source }) => source)
        .filter((source) => !(source in mapped))
    );

    // transpile the set of new child Components and recursively parse their Component subtrees
    await Promise.all(
      [...childComponentSources.entries()]
        .map(async ([childPath, componentSource]) => {
          const transpiledChild = this.getTranspiledComponentSource({
            componentPath: childPath,
            componentSource: buildComponentFunction({ componentPath: childPath, componentSource: await componentSource, isRoot: false }),
            isRoot: false,
          });

          await this.parseComponentTree({
            componentPath: childPath,
            transpiledComponent: transpiledChild,
            mapped,
          });
        })
    );

    return mapped;
  }

  async compileComponent({ componentId, isTrusted }: ComponentCompilerRequest) {
    const componentPath = componentId.split('##')[0];
    const source = await this.getComponentSources([componentPath]).get(componentPath);
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
    if (isTrusted) {
      // recursively parse the Component tree for child Components
      const transformedComponents = await this.parseComponentTree({
        componentPath,
        transpiledComponent,
        mapped: {},
      });

      const [rootComponent, ...childComponents] = Object.values(transformedComponents).map(({ transpiled }) => transpiled);
      const aggregatedSourceLines = rootComponent.split('\n');
      aggregatedSourceLines.splice(1, 0, childComponents.join('\n\n'));
      componentSource = aggregatedSourceLines.join('\n');
    }

    this.sendWorkerMessage({
      componentId,
      componentSource,
    });
  }
}

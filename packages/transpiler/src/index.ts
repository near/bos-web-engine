import Babel from '@babel/standalone';

import { fetchComponentSources } from './source';

type ComponentFetchMap = { [componentPath: string]: Promise<string> };

const sourceCache: ComponentFetchMap = {};
const transpiledCache: { [componentPath: string]: string } = {};

function buildComponentFunctionName(suffix?: string) {
  let name = 'WidgetComponent';
  if (!suffix) {
    return name;
  }

  return name + '_' + suffix.replace(/[.\/]/g, '');
}

type ComponentStateMap = Map<string, { [key: string | symbol]: any }>;

function initializeComponentState(ComponentState: ComponentStateMap, componentInstanceId: string) {
  const buildSafeProxyFromMap = (map: ComponentStateMap, widgetId: string) => new Proxy({}, {
    get(_, key) {
      try {
        return map.get(widgetId)?.[key];
      } catch {
        return undefined;
      }
    }
  });

  const State = {
    init(obj: any) {
      if (!ComponentState.has(componentInstanceId)) {
        ComponentState.set(componentInstanceId, obj);
      }
    },
    update(newState: any, initialState = {}) {
      ComponentState.set(componentInstanceId, Object.assign(initialState, ComponentState.get(componentInstanceId), newState));
    },
  };

  return {
    state: buildSafeProxyFromMap(ComponentState, componentInstanceId),
    State,
  };
}

function buildComponentFunction({ widgetPath, widgetSource, isRoot }: { widgetPath: string, widgetSource: string, isRoot: boolean }) {
  const componentBody = '\n\n/*' + widgetPath + '*/\n\n' + widgetSource;

  const stateInitialization = 'const { state, State} = (' + initializeComponentState.toString() + ')(ComponentState, "' + widgetPath + '");';
  if (isRoot) {
    return `
      function ${buildComponentFunctionName()}() {
        const ComponentState = new Map();
        ${stateInitialization}
        ${componentBody}
      }
    `;
  }

  return `
    function ${buildComponentFunctionName(widgetPath)}({ props }) {
      ${stateInitialization}
      ${componentBody}
    }
  `;
}

function parseChildWidgetPaths(transpiledWidget: string) {
  const widgetRegex = /createElement\(Widget,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>[\w\d_]+\.near\/widget\/[\w\d_.]+))["|']/ig;
  const matches = [...(transpiledWidget.matchAll(widgetRegex))]
      .reduce((widgetInstances, match) => {
        if (!match.groups?.src) {
          return widgetInstances;
        }

        const source = match.groups?.src;
        widgetInstances[source] = {
          source,
          transform: (widgetSource: string, widgetComponentName: string) => widgetSource.replaceAll(match[0], match[0].replace('Widget', widgetComponentName))
        };

        return widgetInstances;
      }, {} as { [key: string]: { source: string, transform: (s: string, n: string) => string } });

  return Object.values(matches);
}

async function parseWidgetTree({ widgetPath, transpiledWidget, mapped }: { widgetPath: string, transpiledWidget: string, mapped: { [key: string]: { transpiled: string } } }) {
  // enumerate the set of Components referenced in the target Component
  const childWidgetPaths = parseChildWidgetPaths(transpiledWidget);
  let transformedWidget = transpiledWidget;

  // replace each child [Widget] reference in the target Component source
  // with the generated name of the inlined Component function definition
  childWidgetPaths.forEach(({ source, transform }) => {
    transformedWidget = transform(transformedWidget, buildComponentFunctionName(source));
  });

  // add the transformed source to the returned Component tree
  mapped[widgetPath] = {
    transpiled: transformedWidget,
  };

  // fetch the set of child Component sources not already added to the tree
  const childWidgetSources = fetchWidgetSource(
      childWidgetPaths.map(({ source }) => source)
          .filter((source) => !(source in mapped))
  );

  // transpile the set of new child Components and recursively parse their Component subtrees
  await Promise.all(
    Object.entries(childWidgetSources)
      .map(async ([childPath, widgetSource]) => {
        const transpiledChild = getTranspiledWidgetSource(
          childPath,
          buildComponentFunction({ widgetPath: childPath, widgetSource: await widgetSource, isRoot: false }),
          false
        );

        await parseWidgetTree({ widgetPath: childPath, transpiledWidget: transpiledChild, mapped });
      })
  );

  return mapped;
}

function transpileSource(source: string) {
  return Babel.transform(source, {
    plugins: [
      [Babel.availablePlugins['transform-react-jsx'], { pragma: 'createElement' }],
    ],
  });
}

function fetchWidgetSource(widgetPaths: string[]): ComponentFetchMap {
  const unfetchedPaths = widgetPaths.filter((widgetPath) => !(widgetPath in sourceCache));
  if (unfetchedPaths.length > 0) {
    const pathsFetch = fetchComponentSources('https://rpc.near.org', unfetchedPaths);
    unfetchedPaths.forEach((widgetPath) => {
      sourceCache[widgetPath] = pathsFetch.then((paths) => paths[widgetPath])
          .catch((e) => console.error(e, { widgetPath }));
    });
  }

  return widgetPaths.reduce((widgetSources, widgetPath) => {
    widgetSources[widgetPath] = sourceCache[widgetPath];
    return widgetSources;
  }, {} as ComponentFetchMap);
}

function getTranspiledWidgetSource(widgetPath: string, widgetSource: string, isRoot: boolean) {
  const cacheKey = JSON.stringify({ widgetPath, isRoot });
  if (!transpiledCache[cacheKey]) {
    const { code } = transpileSource(widgetSource);
    transpiledCache[cacheKey] = code;
  }

  return transpiledCache[cacheKey];
}

export async function getWidgetSource({ widgetId, isTrusted, sendMessage }: { widgetId: string, isTrusted: boolean, sendMessage: (m: any) => void }) {
  const widgetPath = widgetId.split('##')[0];

  try {
    const source = fetchWidgetSource([widgetPath])[widgetPath];
    const transpiledWidget = getTranspiledWidgetSource(
        widgetPath,
        buildComponentFunction({ widgetPath, widgetSource: await source, isRoot: true }),
        true
    );

    let widgetComponent = transpiledWidget;

    if (isTrusted) {
      // recursively parse the Component tree for child Components
      const transformedWidgets = await parseWidgetTree({ widgetPath, transpiledWidget, mapped: {} });
      const [rootWidget, ...childWidgets] = Object.values(transformedWidgets).map(({ transpiled }) => transpiled);
      const aggregatedSourceLines = rootWidget.split('\n')
      aggregatedSourceLines.splice(1, 0, childWidgets.join('\n\n'));
      widgetComponent = aggregatedSourceLines.join('\n');
    }

    sendMessage({
      type: 'transpiler.sourceTranspiled',
      source: widgetId,
      widgetComponent,
    });
  } catch (e) {
    console.error(e);
  }
}

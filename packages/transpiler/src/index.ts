import { buildComponentFunction } from './component';
import { parseWidgetTree } from './parser';
import { fetchComponentSources } from './source';
import { transpileSource } from './transpiler';

type ComponentFetchMap = { [componentPath: string]: Promise<string> };

const sourceCache: ComponentFetchMap = {};
const transpiledCache: { [componentPath: string]: string } = {};

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
      const transformedWidgets = await parseWidgetTree({
        widgetPath,
        transpiledWidget,
        mapped: {},
        fetchWidgetSource: (childPaths: string[]) => fetchWidgetSource(childPaths),
        getTranspiledWidgetSource: (path: string, source: string) => getTranspiledWidgetSource(path, source, false),
      });
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

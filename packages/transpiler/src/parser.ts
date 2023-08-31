import { buildComponentFunction, buildComponentFunctionName } from './component';

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

interface ParseWidgetTreeOptions {
  fetchWidgetSource: (componentPaths: string[]) => { [key: string]: Promise<string> },
  getTranspiledWidgetSource: (widgetPath: string, widgetSource: string, isRoot: boolean) => string,
  mapped: { [key: string]: { transpiled: string } };
  transpiledWidget: string;
  widgetPath: string;
}

export async function parseWidgetTree({
  widgetPath,
  transpiledWidget,
  mapped,
  fetchWidgetSource,
  getTranspiledWidgetSource,
}: ParseWidgetTreeOptions) {
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

        await parseWidgetTree({
            widgetPath: childPath,
            transpiledWidget: transpiledChild,
            mapped,
            getTranspiledWidgetSource,
            fetchWidgetSource,
        });
      })
  );

  return mapped;
}

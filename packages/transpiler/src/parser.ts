export function parseChildComponentPaths(transpiledWidget: string) {
  const widgetRegex = /createElement\(Widget,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>[\w\d_]+\.near\/widget\/[\w\d_.]+))["|']/ig;
  const matches = [...(transpiledWidget.matchAll(widgetRegex))]
    .reduce((widgetInstances, match) => {
      if (!match.groups?.src) {
        return widgetInstances;
      }

      const source = match.groups?.src;
      widgetInstances[source] = {
        source,
        transform: (widgetSource: string, widgetComponentName: string) => widgetSource.replaceAll(match[0], match[0].replace('Widget', widgetComponentName)),
      };

      return widgetInstances;
    }, {} as { [key: string]: { source: string, transform: (s: string, n: string) => string } });

  return Object.values(matches);
}

export function parseChildComponentPaths(transpiledWidget: string) {
  const widgetRegex = /createElement\(Widget,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>[\w_]+\.near\/widget\/[\w_.]+))["|']/ig;
  const matches = [...(transpiledWidget.matchAll(widgetRegex))]
    .reduce((widgetInstances, match) => {
      if (!match.groups?.src) {
        return widgetInstances;
      }

      const source = match.groups?.src;
      widgetInstances[source] = {
        source,
        transform: (widgetSource: string, widgetComponentName: string) => {
          const signaturePrefix = `${widgetComponentName},{__bweMeta:{parentMeta:props.__bweMeta},`;
          return widgetSource.replaceAll(match[0], match[0].replace(/Widget,\s*\{/, signaturePrefix));
        },
      };

      return widgetInstances;
    }, {} as { [key: string]: { source: string, transform: (s: string, n: string) => string } });

  return Object.values(matches);
}

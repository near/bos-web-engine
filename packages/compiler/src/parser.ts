export function parseChildComponentPaths(transpiledComponent: string) {
  const componentRegex = /createElement\(Widget,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/widget\/[\w.]+))["|']/ig;
  const matches = [...(transpiledComponent.matchAll(componentRegex))]
    .reduce((componentInstances, match) => {
      if (!match.groups?.src) {
        return componentInstances;
      }

      const source = match.groups?.src;
      componentInstances[source] = {
        source,
        transform: (componentSource: string, componentName: string) => {
          const signaturePrefix = `${componentName},{__bweMeta:{parentMeta:props.__bweMeta},`;
          return componentSource.replaceAll(match[0], match[0].replace(/Widget,\s*\{/, signaturePrefix));
        },
      };

      return componentInstances;
    }, {} as { [key: string]: { source: string, transform: (s: string, n: string) => string } });

  return Object.values(matches);
}

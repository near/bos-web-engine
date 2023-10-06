function parseWidgetRenders(transpiledComponent: string) {
  const functionOffset = 'createElement'.length;
  const componentRegex =
    /createElement\(Widget,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/widget\/[\w.]+))["|']/gi;
  return [...transpiledComponent.matchAll(componentRegex)].map((match) => {
    const openParenIndex = match.index! + functionOffset;
    let parenCount = 1;
    let idx = openParenIndex + 1;
    while (parenCount > 0) {
      const char = transpiledComponent[idx++];
      if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
      }
    }

    return {
      expression: transpiledComponent.substring(
        openParenIndex - functionOffset,
        idx
      ),
      source: match.groups?.src || '',
    };
  });
}

export function parseChildComponentPaths(transpiledComponent: string) {
  return parseWidgetRenders(transpiledComponent).map(
    ({ expression, source }) => {
      const [trustMatch] = [
        ...expression.matchAll(
          /trust(?:\s*:\s*{(?:[\w\W])*?mode\s*:\s*['"](trusted|sandboxed))/gi
        ),
      ];

      return {
        source,
        trustMode: trustMatch?.[1],
        transform: (componentSource: string, componentName: string) => {
          const signaturePrefix = `${componentName},{__bweMeta:{parentMeta:props.__bweMeta},`;
          return componentSource.replaceAll(
            expression,
            expression.replace(/Widget,\s*\{/, signaturePrefix)
          );
        },
      };
    }
  );
}

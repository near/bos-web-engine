function parseWidgetRenders(transpiledComponent: string) {
  const functionOffset = 'createElement'.length;
  const componentRegex =
    /createElement\(Component,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+))["|']/gi;
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
      index: match.index!,
    };
  });
}

export interface ParsedChildComponent {
  path: string;
  transform: (componentSource: string, componentName: string) => string;
  index: number;
  trustMode: string;
}

export function parseChildComponents(
  transpiledComponent: string
): ParsedChildComponent[] {
  const widgetRenders = parseWidgetRenders(transpiledComponent);
  widgetRenders.sort((a, b) => a.index - b.index);
  return widgetRenders.map(({ expression, index, source }) => {
    const [trustMatch] = [
      ...expression.matchAll(
        /trust(?:\s*:\s*{(?:[\w\W])*?mode\s*:\s*['"](trusted-author|trusted|sandboxed))/gi
      ),
    ];

    return {
      index,
      path: source,
      trustMode: trustMatch?.[1],
      transform: (componentSource: string, componentName: string) => {
        const propsMatch = expression.match(/\s+props:\s*/);

        if (!propsMatch?.index) {
          return componentSource.replaceAll(
            expression,
            expression.replace(/Component/, componentName)
          );
        }

        const openPropsBracketIndex = propsMatch.index + propsMatch[0].length;
        let closePropsBracketIndex = openPropsBracketIndex + 1;
        let openBracketCount = 1;
        while (openBracketCount) {
          const char = expression[closePropsBracketIndex];
          if (char === '{') {
            openBracketCount++;
          } else if (char === '}') {
            openBracketCount--;
          }

          closePropsBracketIndex++;
        }

        const propsString = expression
          .slice(openPropsBracketIndex + 1, closePropsBracketIndex - 1)
          .trim();

        return componentSource.replaceAll(
          expression,
          `createElement(${componentName}, { __bweMeta: { parentMeta: props.__bweMeta }, ${propsString} })`
        );
      },
    };
  });
}

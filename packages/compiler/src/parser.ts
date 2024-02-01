function parseComponentRenders(transpiledComponent: string) {
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
  const componentRenders = parseComponentRenders(transpiledComponent);
  componentRenders.sort((a, b) => a.index - b.index);
  return componentRenders.map(({ expression, index, source }) => {
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
          const referencedExpression = expression.replace(
            /Component,\s+\{/,
            `${componentName}, { __bweMeta: { parentMeta: typeof props === 'undefined' ? null : props?.__bweMeta, `
          );

          return componentSource.replaceAll(
            expression,
            `${referencedExpression.slice(0, -1)}})`
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

        const expressionWithoutProps =
          expression.slice(0, propsMatch.index) +
          expression.slice(closePropsBracketIndex);

        const bosComponentPropsString = expressionWithoutProps
          .slice(expression.indexOf('{') + 1, -3)
          .trim();

        return componentSource.replaceAll(
          expression,
          `createElement(${componentName}, { __bweMeta: { parentMeta: typeof props === 'undefined' ? null : props?.__bweMeta, ${bosComponentPropsString} }, ${propsString} })`
        );
      },
    };
  });
}

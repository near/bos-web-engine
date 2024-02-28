import { ModuleImport } from './types';

function deriveComponentPath(
  componentPath: string,
  componentImport: ModuleImport
) {
  const [author, component] = componentPath.split('/');
  const { modulePath } = componentImport;
  const importPathComponents = modulePath.split('/');
  const pathComponents = component.split('.');

  const parentCount = modulePath.startsWith('..')
    ? modulePath.split('..').length - 1
    : 0;

  return `${author}/${[
    ...pathComponents.slice(
      parentCount,
      pathComponents.length -
        importPathComponents.filter((p) => p.startsWith('.')).length
    ),
    ...importPathComponents.slice(1),
  ].join('.')}`;
}

function parseComponentRenderMatch(
  match: RegExpMatchArray,
  transpiledComponent: string
) {
  const functionOffset = 'createElement'.length;
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
    componentPath: match.groups?.src || '',
    expression: transpiledComponent.substring(
      openParenIndex - functionOffset,
      idx
    ),
    index: match.index!,
  };
}

function getComponentImportReference(moduleImport: ModuleImport) {
  // TODO support non-default imports, i.e. other than `import C from './C'`
  return moduleImport.imports[0].reference;
}

interface ComponentRenderMatch {
  /* the matched render expression in the form of: createElement(ComponentName, ...) */
  expression: string;
  /* starting index of the matched expression within the Component source */
  index: number;
  /* metadata on the matched Component's import statement (n/a for <Component src="..." /> references) */
  moduleImport?: ModuleImport;
  /* matched Component path */
  componentPath: string;
}

function matchDynamicComponents(
  transpiledComponent: string
): ComponentRenderMatch[] {
  return [
    ...transpiledComponent.matchAll(
      /createElement\(Component,\s*\{(?:[\w\W]*?)(?:\s*src:\s*["|'](?<src>((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+))["|']/gi
    ),
  ].map((match) => parseComponentRenderMatch(match, transpiledComponent));
}

function matchImportedComponents(
  componentPath: string,
  transpiledComponent: string,
  moduleImport: ModuleImport
): ComponentRenderMatch[] {
  return [
    ...transpiledComponent.matchAll(
      new RegExp(
        `createElement\\(${getComponentImportReference(moduleImport)},`,
        'ig'
      )
    ),
  ].map((match) => ({
    ...parseComponentRenderMatch(match, transpiledComponent),
    componentPath: moduleImport.isRelative
      ? deriveComponentPath(componentPath, moduleImport)
      : moduleImport.modulePath,
    moduleImport,
  }));
}

interface ParseComponentRendersParams {
  bweModuleImports: ModuleImport[];
  componentPath: string;
  transpiledComponent: string;
}

function parseComponentRenders({
  bweModuleImports,
  componentPath,
  transpiledComponent,
}: ParseComponentRendersParams) {
  return [
    ...matchDynamicComponents(transpiledComponent),
    ...bweModuleImports
      .map((moduleImport) =>
        matchImportedComponents(
          componentPath,
          transpiledComponent,
          moduleImport
        )
      )
      .flat(),
  ];
}

export interface ParsedChildComponent {
  componentImportReference?: string;
  path: string;
  transform: (componentSource: string, componentName: string) => string;
  index: number;
  trustMode: string;
}

interface ChildComponents {
  bweModuleImports: ModuleImport[];
  componentPath: string;
  transpiledComponent: string;
}

export function parseChildComponents({
  bweModuleImports,
  componentPath,
  transpiledComponent,
}: ChildComponents): ParsedChildComponent[] {
  const componentRenders = parseComponentRenders({
    componentPath,
    transpiledComponent,
    bweModuleImports,
  });

  componentRenders.sort((a, b) => a.index - b.index);
  return componentRenders.map(
    ({ expression, index, componentPath: childPath, moduleImport }) => {
      const [trustMatch] = [
        ...expression.matchAll(
          /trust(?:\s*:\s*{(?:[\w\W])*?mode\s*:\s*['"](trusted-author|trusted|sandboxed))/gi
        ),
      ];

      return {
        index,
        componentImportReference:
          moduleImport && getComponentImportReference(moduleImport),
        path: childPath,
        trustMode: trustMatch?.[1],
        transform: (componentSource: string, componentName: string) => {
          const propsMatch = expression.match(/\s+props:\s*/);

          // does expression match `createElement(Component, null)`?
          if (!propsMatch?.index) {
            return componentSource.replaceAll(
              expression,
              `createElement(${componentName}, { __bweMeta: { parentMeta: typeof props === 'undefined' ? null : props?.__bweMeta } })`
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
            expression.slice(0, propsMatch.index - 1) +
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
    }
  );
}

/**
 * Returns the name to be used for the Component function
 * @param componentPath
 */
export function buildComponentFunctionName(componentPath?: string) {
  const name = 'BWEComponent';
  if (!componentPath) {
    return name;
  }

  return name + '_' + componentPath.replace(/[.\/-]/g, '');
}

interface BuildComponentFunctionParams {
  componentImports: string[];
  componentPath: string;
  componentSource: string;
  exported: string | null;
  isRoot: boolean;
}

export function buildComponentFunction({
  componentImports,
  componentPath,
  componentSource,
  exported,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const importAssignments = componentImports.join('\n');
  const commentHeader = `${componentPath} ${isRoot ? '(root)' : ''}`;

  // TODO remove once export is required
  if (!exported) {
    if (isRoot) {
      return `
        function ${functionName}() {
          ${importAssignments}
          ${componentSource}
        }
      `;
    }

    return `
      /************************* ${componentPath} *************************/
      function ${functionName}(__bweInlineComponentProps) {
        ${importAssignments}
        const { __bweMeta, props: __componentProps } = __bweInlineComponentProps;
        const props = Object.assign({ __bweMeta }, __componentProps); 
        ${componentSource}
      }
    `;
  }

  return `
    /************************* ${commentHeader} *************************/
    const ${functionName} = (() => {
      ${importAssignments}
      ${componentSource}
      return ${exported};
    })();
  `;
}

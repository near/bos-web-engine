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
  isRoot: boolean;
}

export function buildComponentFunction({
  componentImports,
  componentPath,
  componentSource,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const importAssignments = componentImports.join('\n');

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

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
  componentPath: string;
  componentSource: string;
  isRoot: boolean;
}

export function buildComponentFunction({
  componentPath,
  componentSource,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);

  if (isRoot) {
    return `
      function ${functionName}() {
        ${componentSource}
      }
    `;
  }

  return `
    /************************* ${componentPath} *************************/
    function ${functionName}(__bweInlineComponentProps) {
      const { __bweMeta, props: __componentProps } = __bweInlineComponentProps;
      const props = Object.assign({ __bweMeta }, __componentProps); 
      ${componentSource}
    }
  `;
}

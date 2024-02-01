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
  exportedReference: string | null;
  isRoot: boolean;
}

export function buildComponentFunction({
  componentImports,
  componentPath,
  componentSource,
  exportedReference,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const importAssignments = componentImports.join('\n');
  const commentHeader = `${componentPath} ${isRoot ? '(root)' : ''}`;

  return `
    /************************* ${commentHeader} *************************/
    const ${functionName} = (() => {
      ${importAssignments}
      ${componentSource}
      return ${exportedReference ? exportedReference : 'BWEComponent'};
    })();
  `;
}

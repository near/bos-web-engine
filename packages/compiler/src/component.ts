import { parseCssModule } from './css';
import { buildComponentImportStatements } from './import';
import type { ModuleImport } from './types';

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
  cssModuleAssignment?: string;
  importAssignments: string[];
  isRoot: boolean;
}

interface BuildComponentSourceParams {
  componentPath: string;
  componentStyles?: string;
  imports: ModuleImport[];
  isRoot: boolean;
  transpiledComponentSource: string;
}

/**
 * Build the transpiled source of a BOS Component along with its imports
 * @param componentPath path to the BOS Component
 * @param componentStyles CSS module for the BOS Component
 * @param exportedReference the name of the default-exported identifier
 * @param imports structured import metadata for dependencies of the BOS Component
 * @param transpiledComponentSource transpiled source code of the BOS Component
 * @param isRoot flag indicating whether this is the root Component of a container
 */
export function buildComponentSource({
  componentPath,
  componentStyles,
  imports,
  isRoot,
  transpiledComponentSource,
}: BuildComponentSourceParams): {
  css?: string;
  cssModule?: string;
  source: string;
} {
  // assignment statements to bind imported identifiers to local aliases
  const importAssignments = imports
    .filter((moduleImport) => moduleImport.isPackage || moduleImport.isPlugin)
    .map((moduleImport) => buildComponentImportStatements(moduleImport))
    .flat()
    .filter((statement) => !!statement) as string[];

  // parse CSS and build assignment for the imported alias
  const parsedCss = componentStyles ? parseCssModule(componentStyles) : null;
  let cssModuleAssignment: string | undefined;
  if (parsedCss) {
    const cssModuleReference = imports.find(({ isCssModule }) => isCssModule)
      ?.imports[0].reference;

    if (cssModuleReference) {
      cssModuleAssignment = `const ${cssModuleReference} = ${JSON.stringify(
        Object.fromEntries([...parsedCss.classMap.entries()])
      )};`;
    }
  }

  // assign a known alias to the exported Component
  const source = buildComponentFunction({
    componentPath,
    componentSource: transpiledComponentSource,
    cssModuleAssignment,
    importAssignments,
    isRoot,
  });

  return {
    css: parsedCss?.stylesheet,
    source,
  };
}

function buildComponentFunction({
  componentPath,
  componentSource,
  cssModuleAssignment,
  importAssignments,
  isRoot,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const commentHeader = `${componentPath} ${isRoot ? '(root)' : ''}`;

  return `
    /************************* ${commentHeader} *************************/
    const ${functionName} = (() => {
      ${importAssignments.join('\n')}
      ${cssModuleAssignment}
      ${componentSource}
    })();
  `;
}

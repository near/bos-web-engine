import { TrustMode } from '@bos-web-engine/common';

import { extractExport } from './export';
import {
  buildComponentImportStatements,
  extractImportStatements,
} from './import';
import { parseChildComponents, ParsedChildComponent } from './parser';
import type { ModuleImport } from './types';

const COMPONENT_IMPORT_PLACEHOLDER = '/* COMPONENT_IMPORT_PLACEHOLDER */';

/**
 * Determine whether a child Component is trusted and can be inlined within the current container
 * @param trustMode explicit trust mode provided for this child render
 * @param path child Component's path
 * @param isComponentPathTrusted flag indicating whether the child is implicitly trusted by virtue of being under a trusted root
 */
export function isChildComponentTrusted(
  { trustMode, path }: ParsedChildComponent,
  isComponentPathTrusted?: (p: string) => boolean
) {
  // child is explicitly trusted by parent or constitutes a new trusted root
  if (trustMode === TrustMode.Trusted || trustMode === TrustMode.TrustAuthor) {
    return true;
  }

  // child is explicitly sandboxed
  if (trustMode === TrustMode.Sandboxed) {
    return false;
  }

  // if the Component is not explicitly trusted or sandboxed, use the parent's
  // predicate to determine whether the Component should be trusted
  if (isComponentPathTrusted) {
    return isComponentPathTrusted(path);
  }

  return false;
}

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
  exportedReference: string | null;
  isRoot: boolean;
  packageImports: string[];
}

interface BuildComponentSourceParams {
  componentPath: string;
  isRoot: boolean;
  transpiledComponentSource: string;
}

/**
 * Build the transpiled source of a BOS Component along with its imports
 * @param componentPath path to the BOS Component
 * @param componentSource source code of the BOS Component
 * @param isRoot flag indicating whether this is the root Component of a container
 */
export function buildComponentSource({
  componentPath,
  isRoot,
  transpiledComponentSource,
}: BuildComponentSourceParams): {
  // componentImports: ModuleImport[];
  childComponents: ParsedChildComponent[];
  packageImports: ModuleImport[];
  source: string;
} {
  // separate out import statements from Component source
  const { imports, source: importlessSource } = extractImportStatements(
    transpiledComponentSource
  );

  // get the exported reference's name and remove the export keyword(s) from Component source
  // TODO halt parsing of the current Component if no export is found
  const {
    exportedReference,
    hasExport,
    source: cleanComponentSource,
  } = extractExport(importlessSource);

  if (!hasExport) {
    throw new Error(
      `Could not parse Component ${componentPath}: missing valid Component export`
    );
  }

  const packageImports = imports
    .filter((moduleImport) => !moduleImport.isBweModule)
    .map((moduleImport) => buildComponentImportStatements(moduleImport))
    .flat()
    .filter((statement) => !!statement) as string[];

  // assign a known alias to the exported Component
  const source = buildComponentFunction({
    componentPath,
    componentSource: cleanComponentSource,
    packageImports,
    exportedReference,
    isRoot,
  });

  // enumerate the set of Components imported by the current Component
  const childComponents = parseChildComponents({
    bweModuleImports: imports.filter(({ isBweModule }) => isBweModule),
    componentPath,
    transpiledComponent: source,
  });

  const importedComponentDefinitions = childComponents
    .filter(
      (child) =>
        !isChildComponentTrusted(child) && child.componentImportReference
    )
    .map((child) =>
      buildSandboxedChildComponent({
        componentName: child.componentImportReference!,
        componentPath: child.path,
      })
    )
    .join('\n');

  return {
    childComponents,
    packageImports: imports.filter(({ isBweModule }) => !isBweModule),
    source: source.replace(
      COMPONENT_IMPORT_PLACEHOLDER,
      importedComponentDefinitions
    ),
  };
}

function buildComponentFunction({
  componentPath,
  componentSource,
  exportedReference,
  isRoot,
  packageImports,
}: BuildComponentFunctionParams) {
  const functionName = buildComponentFunctionName(isRoot ? '' : componentPath);
  const importAssignments = packageImports.join('\n');
  const commentHeader = `${componentPath} ${isRoot ? '(root)' : ''}`;

  return `
    /************************* ${commentHeader} *************************/
    const ${functionName} = (() => {
      ${importAssignments}
      ${COMPONENT_IMPORT_PLACEHOLDER}
      ${componentSource}
      return ${exportedReference ? exportedReference : 'BWEComponent'};
    })();
  `;
}

export function buildSandboxedChildComponent({
  componentName,
  componentPath,
}: {
  componentName: string;
  componentPath: string;
}) {
  return `
    function ${componentName}(childProps) {
      const { props, ...componentProps } = childProps;
      return __Preact.createElement(Component, { ...componentProps, props, src: "${componentPath}" });
    }
  `;
}

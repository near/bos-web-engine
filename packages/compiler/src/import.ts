import initializeSocialDbPlugin from '@bos-web-engine/social-db-plugin';
import initializeWalletSelectorPlugin from '@bos-web-engine/wallet-selector-plugin';

import type { ImportExpression, ModuleImport } from './types';

const PREACT_VERSION = '10.20.1';
const BWE_MODULE_URL_PREFIX = 'near://';
const PLUGIN_MODULES = new Map<string, string>([
  ['@bos-web-engine/social-db-plugin', initializeSocialDbPlugin.toString()],
  [
    '@bos-web-engine/wallet-selector-plugin',
    initializeWalletSelectorPlugin.toString(),
  ],
]);

const isBweModuleImportPath = (moduleImportPath: string) => {
  return moduleImportPath.startsWith(BWE_MODULE_URL_PREFIX);
};

/**
 * Parse import statement metadata
 * @param modulePath the import path from `import X from "X"`, where "X" can be relative ("./BWEComponent") or absolute ("react")
 * @param imports structured metadata on individual imported references, e.g. destructured, default, etc.
 */
export function parseModuleImport(
  modulePath: string,
  imports: ImportExpression[]
): ModuleImport {
  let moduleName = extractModuleName(modulePath);
  const isRelative = !!modulePath?.match(/^\.?\.\/(\.\.\/)*[a-z_$][\w\/]*$/gi);

  // TODO check against Component name
  const isCssModule =
    modulePath.startsWith('./') && modulePath.endsWith('.module.css');

  const isComponentImport = isBweModuleImportPath(modulePath);
  if (isComponentImport) {
    moduleName = moduleName.replace(BWE_MODULE_URL_PREFIX, '');
    modulePath = modulePath.replace(BWE_MODULE_URL_PREFIX, '');
  }

  const isPlugin = PLUGIN_MODULES.has(moduleName);
  const isBweModule = (isRelative && !isCssModule) || isComponentImport;

  return {
    imports,
    isBweModule,
    isCssModule,
    isPackage: !isPlugin && !isBweModule && !isCssModule,
    isPlugin,
    isRelative,
    moduleName,
    modulePath,
  } as ModuleImport;
}

const extractModuleName = (modulePath: string) => {
  let path = modulePath;
  if (modulePath.startsWith('https://')) {
    path = modulePath.split('/').slice(3).join('/');
    const terminatingIndex = ['&', '?'].reduce(
      (min, c) => Math.min(path.indexOf(c), min),
      path.length
    );

    if (terminatingIndex > 1) {
      path = path.slice(0, terminatingIndex);
    }
  }

  if (path.startsWith('@')) {
    return `@${path.split('@')[1]}`;
  }

  return path;
};

/**
 * Build container-level imports based on module imports across all Components
 * @param moduleImports set of module imports across Components within a container
 */
export const buildModuleImportStatements = (
  moduleImports: ModuleImport[]
): string[] => {
  if (!moduleImports.length) {
    return [];
  }

  const sideEffectImports = moduleImports
    .filter(({ isSideEffect }) => isSideEffect)
    .map(({ moduleName }) => `import "${moduleName}";`);

  const importsByModule = moduleImports.reduce(
    (byModule, { imports, isSideEffect, moduleName }) => {
      if (isSideEffect) {
        return byModule;
      }

      if (!byModule.has(moduleName)) {
        byModule.set(moduleName, []);
      }

      const currentImports = byModule.get(moduleName)!;
      byModule.set(moduleName, currentImports.concat(imports));

      return byModule;
    },
    new Map<string, ImportExpression[]>()
  );

  const importStatements: string[] = [...importsByModule.entries()]
    .map(([moduleName, imports]) => {
      const { defaultAlias, namespaceAlias } = buildModuleAliases(moduleName);
      const { defaultImport, destructuredImports, namespaceImport } =
        aggregateModuleImports(imports);

      const destructuredReferences = [
        ...new Set(
          destructuredImports.map(({ alias, reference }) =>
            alias ? `${reference} as ${alias}` : reference
          )
        ),
      ].join(', ');

      // only destructured references, cannot assume the module has a default import
      if (!defaultImport && !namespaceImport) {
        return `import { ${destructuredReferences} } from "${moduleName}";`;
      }

      if (defaultImport) {
        if (namespaceImport) {
          return `import ${defaultAlias}, * as ${namespaceAlias} from "${moduleName}";`;
        } else if (destructuredReferences) {
          return `import ${defaultAlias}, { ${destructuredReferences} } from "${moduleName}";`;
        } else {
          return `import ${defaultAlias} from "${moduleName}";`;
        }
      }

      if (namespaceImport) {
        return `import * as ${namespaceAlias} from "${moduleName}";`;
      }

      return '';
    })
    .filter((statement) => !!statement);

  return [...importStatements, ...sideEffectImports];
};

/**
 * Build container-level module aliases to be referenced by individual Components
 * @param moduleName name of the imported module
 */
const buildModuleAliases = (moduleName: string) => {
  // replace invalid JS identifier chars with _
  const moduleAlias = moduleName.replace(/[:?&/@.-]/g, '_');

  return {
    defaultAlias: `__BWEModule__${moduleAlias}`,
    namespaceAlias: `__BWEModuleNS__${moduleAlias}`,
  };
};

interface ImportsByType {
  defaultImport: ImportExpression;
  destructuredImports: ImportExpression[];
  namespaceImport: ImportExpression;
}

/**
 * Build the set of assignment statements for a Component to reference an imported module
 * @param moduleImport all imported references for a specific module imported by a Component
 */
export const buildComponentImportStatements = (
  moduleImport: ModuleImport
): string[] => {
  const { imports, isPlugin, isSideEffect, moduleName } = moduleImport;
  if (isSideEffect) {
    return [];
  }

  const { defaultAlias, namespaceAlias } = buildModuleAliases(moduleName);
  const { defaultImport, destructuredImports, namespaceImport } =
    aggregateModuleImports(imports);

  const statements: string[] = [];
  const destructuredStatements = destructuredImports
    .map(({ alias, reference }: ImportExpression) => {
      // import { X as x } from 'x'
      if (alias) {
        return `${reference}: ${alias}`;
      }

      // import { X } from 'x'
      return reference;
    })
    .join(', ');

  if (isPlugin) {
    statements.push(
      `const ${defaultAlias} = (${PLUGIN_MODULES.get(moduleName)})();`
    );
    statements.push(`const ${namespaceAlias} = ${defaultAlias};`);
  }

  if (defaultImport) {
    // import X from 'x'
    statements.push(`const ${defaultImport.reference} = ${defaultAlias};`);
    if (destructuredStatements) {
      // import X, { x, y } from 'x'
      statements.push(`const { ${destructuredStatements} } = ${defaultAlias};`);
    } else if (namespaceImport) {
      // import X, * as XStar from 'x'
      statements.push(`const ${namespaceImport.alias} = ${namespaceAlias};`);
    }
  } else if (namespaceImport) {
    statements.push(`const ${namespaceImport.alias} = ${namespaceAlias};`);
  } else if (destructuredStatements) {
    // import { x, y } from 'x'
    // if the import only uses destructured references, it's possible that the module
    // does not expose a default, causing a default-style import to break - therefore
    // assume that all imports with only destructuring behave in this way
    // this means references for destructuring imports are always at container scope

    // plugins are expanded inline, the destructuring "import" here is an object destructure
    if (isPlugin) {
      statements.push(`const { ${destructuredStatements} } = ${defaultAlias};`);
    }
    // } else {
    //   throw new Error(`Invalid import for module ${moduleName}`);
  }

  return statements;
};

/**
 * Break down a set of imports for a particular module based on how it's imported
 * @param imports set of imports for this module (i.e. across a single Component or container)
 */
const aggregateModuleImports = (imports: ImportExpression[]): ImportsByType => {
  return imports.reduce(
    (importsByType, expression) => {
      if (expression.isDefault) {
        importsByType.defaultImport = expression;
      } else if (expression.isNamespace) {
        importsByType.namespaceImport = expression;
      } else if (expression.isDestructured) {
        importsByType.destructuredImports.push(expression);
      }
      return importsByType;
    },
    {
      defaultImport: '',
      destructuredImports: [],
      namespaceImport: '',
    } as ImportsByType
  );
};

/**
 * Build the importmap URL based on package name/URL
 * @param moduleName module name specified in the import statement
 * @param modulePath module import path
 * @param references set of destructured references for tree shaking
 */
export const buildModulePackageUrl = (
  moduleName: string,
  modulePath: string,
  references: string[]
) => {
  if (modulePath.startsWith('https://')) {
    return {
      moduleName,
      url: modulePath,
    };
  }

  const queryStringParams = new Map([
    ['alias', 'react:preact/compat'],
    ['external', 'preact'],
  ]);

  if (references.length) {
    queryStringParams.set('exports', references.join(','));
  }

  return {
    moduleName,
    url: `https://esm.sh/${moduleName}?${[...queryStringParams.entries()]
      .map((entry) => entry.join('='))
      .join('&')}`,
  };
};

/**
 * Given a set of module imports, construct the importmap with references to esm.sh modules
 * @param containerModuleImports set of module imports across the container
 */
export const buildContainerModuleImports = (
  containerModuleImports: ModuleImport[]
) => {
  const importedModules = containerModuleImports.reduce(
    (importMap, { moduleName, modulePath, imports }) => {
      const destructuredReferences = imports
        .filter(({ isDestructured }) => isDestructured)
        .map(({ reference }) => reference!);

      const importMapEntries = buildModulePackageUrl(
        moduleName,
        modulePath,
        destructuredReferences.length === imports.length
          ? destructuredReferences
          : []
      );

      if (!importMapEntries) {
        return importMap;
      }

      const moduleEntry = importMap.get(moduleName);
      if (moduleEntry) {
        return importMap;
      }

      importMap.set(importMapEntries.moduleName, importMapEntries.url);
      return importMap;
    },
    new Map<string, string>()
  );

  // set the Preact import maps
  const preactImportPath = `https://esm.sh/stable/preact@${PREACT_VERSION}`;
  const preactCompatPath = `https://esm.sh/preact@${PREACT_VERSION}/compat`;
  importedModules.set('preact', preactImportPath);
  importedModules.set('react', preactCompatPath);
  importedModules.set('react-dom', preactCompatPath);

  // remove conflicting imports from source
  for (const moduleName of importedModules.keys()) {
    const [lib, subpath] = moduleName.split('/');
    if (subpath && ['preact', 'react-dom'].includes(lib)) {
      importedModules.delete(moduleName);
    }
  }

  importedModules.set('preact/compat', preactCompatPath);
  importedModules.set('preact/compat/', `${preactCompatPath}/`);

  return importedModules;
};

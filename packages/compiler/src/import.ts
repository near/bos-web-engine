import type { ImportExpression, ModuleImport } from './types';

type ImportModule = { modulePath: string };
type ImportMixed = ImportModule & {
  destructured?: string;
  namespace?: string;
  reference: string;
};

const BWE_MODULE_URL_PREFIX = 'near://';

const stripLeadingComment = (source: string) => {
  if (!source) {
    return source;
  }

  if (source.startsWith('//')) {
    return source.slice(source.indexOf('\n') + 1).trim();
  }

  if (source.startsWith('/*')) {
    let i = 2;
    while (i < source.length) {
      if (source.slice(i, i + 2) === '*/') {
        return source.slice(i + 2).trim();
      }
      i++;
    }
  }

  return source;
};

const isBweModuleImportPath = (moduleImportPath: string) => {
  return moduleImportPath.startsWith(BWE_MODULE_URL_PREFIX);
};

// valid combinations of default, namespace, and destructured imports
const MIXED_IMPORT_REGEX =
  /^import\s+(?<reference>[\w$]+)?\s*,?(\s*\*\s+as\s+(?<namespace>[\w-]+))?(\s*{\s*(?<destructured>[\w\s*\/,$-]+)})?\s+from\s+["'`](?<modulePath>[\w@\/.:?&=-]+)["'`];?\s*/gi;
const SIDE_EFFECT_IMPORT_REGEX =
  /^import\s+["'](?<modulePath>[\w@\/.:?&=-]+)["'];?\s*/gi;

/**
 * Given BOS Component source code, return an object with the `import`-less source code and array of structured import statements
 * @param source BOS Component source code
 */
export const extractImportStatements = (source: string) => {
  let src = stripLeadingComment(source.trim());

  const imports: ModuleImport[] = [];
  while (src.startsWith('import')) {
    const [mixedMatch] = [...src.matchAll(MIXED_IMPORT_REGEX)];
    if (mixedMatch) {
      let { reference, namespace, destructured, modulePath } =
        mixedMatch.groups as ImportMixed;

      let moduleName = extractModuleName(modulePath);
      const isRelative = !!modulePath?.match(
        /^\.?\.\/(\.\.\/)*[a-z_$][\w\/]*$/gi
      );

      // TODO check against Component name
      const isCssModule =
        modulePath.startsWith('./') && modulePath.endsWith('.module.css');

      const isComponentImport = isBweModuleImportPath(modulePath);
      if (isComponentImport) {
        moduleName = moduleName.replace(BWE_MODULE_URL_PREFIX, '');
        modulePath = modulePath.replace(BWE_MODULE_URL_PREFIX, '');
      }

      const isBweModule = (isRelative && !isCssModule) || isComponentImport;
      const importMeta = {
        isBweModule,
        isCssModule,
        isPackageImport: !isBweModule && !isCssModule,
        isRelative,
        moduleName,
        modulePath,
      };

      if (destructured) {
        const destructuredReferences = destructured
          .trim()
          .replace(/\/\*.+?\*\//gi, '') // remove comments
          .split(',')
          .filter((expression) => !!expression)
          .map((expression) => {
            const [reference, alias] = expression
              .split(' as ')
              .map((s) => s.trim());

            if (alias) {
              return { alias, reference, isDestructured: true };
            }

            return { reference, isDestructured: true };
          });

        imports.push({
          ...importMeta,
          imports: [
            ...(reference ? [{ isDefault: true, reference }] : []),
            ...destructuredReferences,
          ],
        });
      } else if (namespace) {
        imports.push({
          ...importMeta,
          imports: [
            ...(reference ? [{ isDefault: true, reference }] : []),
            { isNamespace: true, alias: namespace },
          ],
        });
      } else {
        imports.push({
          ...importMeta,
          imports: [{ isDefault: true, reference }],
        });
      }

      src = src.replace(mixedMatch[0], '');
    } else {
      const [sideEffectMatch] = [...src.matchAll(SIDE_EFFECT_IMPORT_REGEX)];
      if (sideEffectMatch) {
        const { modulePath } = sideEffectMatch.groups as ImportModule;
        imports.push({
          imports: [],
          isCssModule: false,
          isSideEffect: true,
          isPackageImport: true,
          moduleName: extractModuleName(modulePath),
          modulePath,
        });
        src = src.replace(sideEffectMatch[0], '');
      } else {
        // invalid import
        console.error(
          `Could not parse import statement: ${src.slice(0, 255)}...`
        );
        break;
      }
    }

    src = stripLeadingComment(src.trim());
  }

  return {
    imports,
    source: src,
  };
};

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
export const buildModuleImports = (moduleImports: ModuleImport[]): string[] => {
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
  const { imports, isSideEffect, moduleName } = moduleImport;
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
  } else {
    throw new Error(`Invalid import for module ${moduleName}`);
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
 * @param preactVersion version of Preact dependency
 */
export const buildModulePackageUrl = (
  moduleName: string,
  modulePath: string,
  preactVersion: string
) => {
  if (modulePath.startsWith('https://')) {
    return {
      moduleName,
      url: modulePath,
    };
  }

  return {
    moduleName,
    url: `https://esm.sh/${moduleName}?alias=react:preact/compat&deps=preact@${preactVersion}`,
  };
};

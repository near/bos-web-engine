import type {
  ComponentImport,
  ComponentMap,
  ContainerImport,
  ImportExpression,
  ModuleImports,
} from './types';

interface BOSComponent {
  componentPath: string;
  importReferences?: ImportExpression[];
}

/**
 * Given BOS Component source code, return an object with the `import`-less source code and array of structured import statements
 * @param source BOS Component source code
 */
export const extractImportStatements = (source: string) => {
  let importStatements = source.split('import ').slice(1);
  // no import statements
  if (!importStatements.length) {
    return {
      imports: [],
      source,
    };
  }

  const [statementWithSource] = importStatements.slice(-1);
  importStatements = importStatements.slice(0, -1);

  const matches = statementWithSource.match(/(from\s+)?['"][\w+/-]+["']/gi);
  if (!matches) {
    throw new Error(`Failed to match import statement: ${statementWithSource}`);
  }

  const [importMatch] = matches;
  const finalImportStatement = statementWithSource.slice(
    0,
    statementWithSource.indexOf(importMatch) + importMatch.length
  );
  importStatements.push(finalImportStatement);

  const componentSource = statementWithSource.slice(
    finalImportStatement.length + 1
  );

  return {
    imports: importStatements.map((statement) => parseImport(statement)),
    source: componentSource,
  };
};

/**
 * Aggregate imports for all modules across all referencing Components
 * @param components set of Components within a container
 *
 * @return container and component-level import and assignment statements for all imported modules
 */
export const buildModuleImports = (
  components: ComponentMap
): ContainerImport => {
  const moduleImports = [...components.entries()].reduce(
    (acc, [path, { imports }]) => {
      imports.forEach(({ imports: importReferences, module }) => {
        if (!acc.has(module)) {
          acc.set(module, []);
        }

        acc.get(module)!.push({
          componentPath: path,
          importReferences,
        });
      });
      return acc;
    },
    new Map<string, BOSComponent[]>()
  );

  const containerImports: ContainerImport = {
    statements: [],
    imports: new Map<string, ComponentImport>(),
  };

  moduleImports.forEach((components, module) => {
    const { statements, imports } = aggregateModuleImports(module, components);
    containerImports.statements = [
      ...containerImports.statements,
      ...statements,
    ];

    imports.forEach(({ statements }, componentPath) => {
      if (!containerImports.imports.has(componentPath)) {
        containerImports.imports.set(componentPath, { statements: [] });
      }

      const componentImports = containerImports.imports
        .get(componentPath)!
        .statements.concat(statements);

      containerImports.imports.get(componentPath)!.statements =
        componentImports;
    });
  });

  return containerImports;
};

/**
 * Map a valid module/NPM package name to a valid JS identifier
 * @param moduleName name of the imported module
 */
const escapeModuleName = (moduleName: string) => {
  return moduleName.replace(/[:?&/@-]/g, '_');
};

/**
 * For the given module, construct the import statements at the container level
 * and assignment statements for each Component referencing this module
 * @param module name of the module being imported
 * @param components set of BOS Components referencing this module
 *
 * @return container and component-level import and assignment statements for the given module
 */
const aggregateModuleImports = (
  module: string,
  components: BOSComponent[]
): ContainerImport => {
  const moduleAlias = escapeModuleName(module);
  const bweAlias = `__BWEModule__${moduleAlias}`;
  const bweNamespacedAlias = `__BWEModule__namespaced__${moduleAlias}`;
  let hasNamespace = false;

  const imports = components.reduce(
    (componentImports, { componentPath, importReferences }) => {
      if (!componentImports.has(componentPath)) {
        componentImports.set(componentPath, { statements: [] });
      }

      if (!importReferences) {
        return componentImports;
      }

      const topLevelStatements = importReferences
        .filter(({ isDestructured }) => !isDestructured)
        .map(
          ({ alias, isDefault, isNamespace, reference }: ImportExpression) => {
            // import X from 'x'
            if (isDefault) {
              return `const ${reference} = ${bweAlias};`;
            }

            // import * as X from 'x'
            if (isNamespace && alias) {
              hasNamespace = true;
              return `const ${alias} = ${bweNamespacedAlias}`;
            }
          }
        );

      const destructuredReferences = importReferences
        .filter(({ isDestructured }) => isDestructured)
        .map(({ alias, reference }: ImportExpression) => {
          // import { X as x } from 'x'
          if (alias) {
            return `${reference}: ${alias}`;
          }

          // import { X } from 'x'
          return reference;
        })
        .join(', ');

      const destructuredAssignment = destructuredReferences.length
        ? `const { ${destructuredReferences} } = ${bweAlias};`
        : null;

      componentImports.set(componentPath, {
        statements: [
          ...topLevelStatements,
          ...(destructuredAssignment ? [destructuredAssignment] : []),
        ] as string[],
      });

      return componentImports;
    },
    new Map<string, ComponentImport>()
  );

  let containerImportComponents = [`import ${bweAlias}`, `from '${module}';`];
  if (hasNamespace) {
    containerImportComponents.splice(1, 0, `, * as ${bweNamespacedAlias}`);
  }

  return {
    statements: [containerImportComponents.join(' ')],
    imports,
  };
};

/**
 * Extract metadata from an import statement
 * @param importReference imported references, i.e. the bit between `import` and `from`
 * @param isDestructured flag indicating whether this reference is from a destructured import
 */
const parseImportReference = (
  importReference: string,
  isDestructured: boolean
): ImportExpression | null => {
  const ref = importReference.trim();
  if (ref.startsWith('*')) {
    return {
      isNamespace: true,
      alias: ref.split(' as ')[1].trim(),
    };
  } else if (ref.startsWith('/')) {
    return null;
  } else if (ref.includes(' as ')) {
    const [reference, alias] = ref.split(' as ').map((r) => r.trim());
    return {
      alias,
      reference,
      isDestructured,
    };
  }

  return {
    reference: ref,
    isDefault: !isDestructured,
    isDestructured,
  };
};

/**
 * Extract metadata from an import statement
 * @param statement import statement
 */
const parseImport = (statement: string): ModuleImports => {
  let parsed = statement.replace('import ', '');
  if (parsed.endsWith(';')) {
    parsed = parsed.slice(0, parsed.length - 2);
  }

  // import 'x'
  if (!parsed.includes(' from ')) {
    return {
      module: parsed.trim().replace(/"'/g, ''),
      isSideEffect: true,
      imports: [],
    };
  }

  let [imported, module] = parsed.split(' from ');
  module = module.replace(/["';\n]/g, '');

  let openDestructure = false;
  const imports = imported
    .split(',')
    .map((reference) => {
      let ref = reference.trim();
      const isOpenBracket = ref.startsWith('{');
      const isCloseBracket = ref.endsWith('}');

      if (isOpenBracket) {
        openDestructure = true;
      }

      const parsedExpression = parseImportReference(
        ref.slice(isOpenBracket ? 1 : 0, ref.length - (isCloseBracket ? 1 : 0)),
        openDestructure
      );

      if (isCloseBracket) {
        openDestructure = false;
      }

      return parsedExpression;
    })
    .flat()
    .filter((refMeta) => !!refMeta) as ImportExpression[]; // filter out null values from comments

  return {
    imports,
    module,
  };
};

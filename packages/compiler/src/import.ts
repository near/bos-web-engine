import type {
  BOSComponent,
  ContainerImport,
  ImportExpression,
  ImportTypes,
} from './types';

/**
 * Aggregate imports for all modules across all referencing Components
 * @param components set of Components within a container
 *
 * @return container and component-level import and assignment statements for all imported modules
 */
export const buildModuleImports = (
  components: BOSComponent[]
): ContainerImport => {
  const componentImports = components.map((component) => ({
    ...component,
    imports: component.source
      .split('import ')
      .slice(1)
      .map((statement, i, statements) => {
        // for the last import statement, truncate the remaining code
        if (i === statements.length - 1) {
          const matches = statement.match(/(from\s+)?['"][\w+-]+["']/gi);
          if (!matches) {
            throw new Error(`Failed to match import statement: ${statement}`);
          }

          const [importMatch] = matches;
          return parseImport(
            statement.slice(
              0,
              statement.indexOf(importMatch) + importMatch.length
            )
          );
        }
        return parseImport(statement);
      }),
  }));

  const moduleReferences = componentImports.reduce(
    (importsByModule, { componentId, imports }) => {
      for (let { importReferences, module } of imports) {
        if (!importsByModule.has(module)) {
          importsByModule.set(module, []);
        }

        importsByModule.get(module).push({
          componentId,
          importReferences,
        });
      }

      return importsByModule;
    },
    new Map()
  );

  const containerImports: ContainerImport = {
    statement: '',
    imports: new Map<string, string[]>(),
  };

  moduleReferences.forEach((components, module) => {
    const { statement, imports } = aggregateModuleImports(module, components);
    containerImports.statement += `${statement}\n`;
    imports.forEach((importStatements, componentId) => {
      if (!containerImports.imports.has(componentId)) {
        containerImports.imports.set(componentId, []);
      }

      const componentImports = containerImports.imports
        .get(componentId)!
        .concat(importStatements);
      containerImports.imports.set(componentId, componentImports);
    });
  });

  return containerImports;
};

/**
 * Map a valid module/NPM package name to a valid JS identifier
 * @param moduleName name of the imported module
 */
const escapeModuleName = (moduleName: string) => {
  return moduleName.replace(/-/g, '_');
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
    (componentImports, { componentId, importReferences }) => {
      if (!componentImports.has(componentId)) {
        componentImports.set(componentId, []);
      }

      if (!importReferences) {
        return componentImports;
      }

      const { topLevelImports, destructuredImports } = importReferences.reduce(
        (importTypes: ImportTypes, ref: ImportExpression | null) => {
          if (!ref) {
            return importTypes;
          }

          if (ref.isDestructured) {
            importTypes.destructuredImports.push(ref);
          } else {
            importTypes.topLevelImports.push(ref);
          }

          return importTypes;
        },
        { topLevelImports: [], destructuredImports: [] }
      );

      const topLevelStatements = topLevelImports.map(
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

      const destructuredReferences = destructuredImports
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

      componentImports.set(componentId, [
        ...topLevelStatements,
        ...(destructuredAssignment ? [destructuredAssignment] : []),
      ]);

      return componentImports;
    },
    new Map()
  );

  let containerImportComponents = [`import ${bweAlias}`, `from '${module}';`];
  if (hasNamespace) {
    containerImportComponents.splice(1, 0, `, * as ${bweNamespacedAlias}`);
  }

  return {
    statement: containerImportComponents.join(' '),
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
const parseImport = (statement: string) => {
  let parsed = statement.replace('import ', '');
  if (parsed.endsWith(';')) {
    parsed = parsed.slice(0, parsed.length - 2);
  }

  // side-effect import
  if (!parsed.includes(' from ')) {
    return { module: parsed.trim().replace(/"'/g, '') };
  }

  let [imported, module] = parsed.split(' from ');
  module = module.replace(/["';\n]/g, '');

  let openDestructure = false;
  const importReferences = imported
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
    .filter((refMeta) => !!refMeta);

  return {
    importReferences,
    module,
    statement,
  };
};

import Babel from '@babel/standalone';
import type {
  CallExpression,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  NullLiteral,
  ObjectExpression,
  ObjectMethod,
  ObjectProperty,
  SpreadElement,
  StringLiteral,
  TSAsExpression,
  VariableDeclaration,
} from '@babel/types';
import { TrustMode } from '@bos-web-engine/common';

import { buildComponentFunctionName } from './component';
import { parseModuleImport } from './import';
import type { ImportExpression, ModuleExport, ModuleImport } from './types';

/**
 * Derive a BOS Component path from a relative import
 * @param componentPath path of the Component importing another BOS Component via relative path
 * @param componentImport import metadata for the relative import
 */
export function deriveComponentPath(
  componentPath: string,
  componentImport: ModuleImport
) {
  const [author, component] = componentPath.split('/');
  const { modulePath } = componentImport;
  const importPathComponents = modulePath.split('/');
  const pathComponents = component.split('.');

  const parentCount = modulePath.startsWith('..')
    ? modulePath.split('..').length - 1
    : 0;

  return `${author}/${[
    ...pathComponents.slice(
      parentCount,
      pathComponents.length -
        importPathComponents.filter((p) => p.startsWith('.')).length
    ),
    ...importPathComponents.slice(1),
  ].join('.')}`;
}

/**
 * Determine whether a child Component is trusted and can be inlined within the current container
 * @param trustMode explicit trust mode provided for this child render
 * @param path child Component's path
 * @param isComponentPathTrusted flag indicating whether the child is implicitly trusted by virtue of being under a trusted root
 */
function isChildComponentTrusted(
  { trustMode, path }: { trustMode: string | undefined; path: string },
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

interface TranspileSourceParams {
  componentPath: string;
  source: string;
  isComponentPathTrusted?: (path: string) => boolean;
}

export function transpileSource({
  componentPath,
  source,
  isComponentPathTrusted,
}: TranspileSourceParams) {
  const exports: ModuleExport = { default: '', named: [] };
  const imports: ModuleImport[] = [];
  const componentReferences: { [component: string]: ModuleImport } = {};
  const children: {
    isTrusted: boolean;
    path: string;
    trustMode: string;
  }[] = [];

  const transformComponents = ({ types: t }: any) => ({
    visitor: {
      CallExpression(path: {
        node: {
          arguments: [
            Identifier | StringLiteral,
            ObjectExpression | CallExpression | undefined,
          ];
          callee: { object: Identifier; property: Identifier };
        };
        remove: () => void;
      }) {
        const {
          arguments: args,
          callee: { object, property },
        } = path.node;

        const isCreateElement =
          object?.name === '__Preact' && property?.name === 'createElement';
        const isElement = t.isStringLiteral(args[0]);
        if (!isCreateElement || isElement) {
          if (isElement && (args[0] as StringLiteral).value === 'script') {
            path.remove();
          }
          return;
        }

        let [Component, props] = args as [
          Identifier,
          ObjectExpression | CallExpression | NullLiteral,
        ];

        if (t.isNullLiteral(props)) {
          // if props were not provided, initialize to an empty object
          props = t.objectExpression([]);
          path.node.arguments[1] = props as ObjectExpression;
        } else if (
          t.isCallExpression(props) &&
          ((props as CallExpression).callee as Identifier)?.name === '_extends'
        ) {
          // if props is a CallExpression from Babel's _extends() function,
          // modify the explicitly-specified props and leave the spread
          props = (props as CallExpression).arguments[0] as ObjectExpression;
        }
        props = props as ObjectExpression;

        /**
         * FIXME referencing `arguments` only works when the Component rendering takes place within
         *  in a scope in which the correct props is bound to arguments[0], i.e. the Component's root
         *  scope - in the directly-returned JSX or an arrow function in the Component's root scope.
         *
         *  TODO the correct solution is for the parser to inject the `bwe` reference into the Component
         *   props argument, but it would also need to be made accessible to the render site
         *
         *   TL; DR
         *   this preserves ancestry:
         *   import Y from './Y';
         *   export default function X() { return <Y />; }
         *
         *   this doesn't:
         *   import Y from './Y';
         *   const renderY = () => <Y />;
         *   export default function X() { return <>{renderY()}</> }
         */
        const propsAccessor = t.memberExpression(
          t.identifier('arguments'),
          t.numericLiteral(0),
          true
        );

        const keyProp = (props.properties as ObjectProperty[]).find(
          ({ key }) => t.isIdentifier(key) && (key as Identifier).name === 'key'
        ) as ObjectProperty;

        const bweMeta = t.objectExpression([
          t.objectProperty(
            t.identifier('parentMeta'),
            t.logicalExpression(
              '&&',
              propsAccessor,
              t.memberExpression(propsAccessor, t.identifier('bwe'))
            )
          ),
          ...(keyProp
            ? [t.objectProperty(t.identifier('key'), keyProp.value)]
            : []),
        ]);

        const propsExpressions = props.properties.reduce(
          (
            expressions,
            property: ObjectMethod | ObjectProperty | SpreadElement
          ) => {
            const { key, value } = property as ObjectProperty;
            const name = (key as Identifier)?.name;
            if (!name) {
              if (!t.isSpreadElement(property)) {
                console.error(`Unexpected props type "${property.type}"`);
              }

              return expressions;
            }
            expressions[name] = value;
            return expressions;
          },
          {} as any
        ) as {
          bwe?: ObjectExpression;
          key?: string;
          src?: StringLiteral | Identifier;
        };

        const componentImport = componentReferences[Component.name];
        if (componentImport) {
          const src = componentImport.isRelative
            ? deriveComponentPath(componentPath, componentImport)
            : componentImport.modulePath;

          const trustValue = (
            (
              propsExpressions.bwe?.properties.find((p) => {
                if (!t.isObjectProperty(p)) {
                  return;
                }

                const { key } = p as ObjectProperty;
                if (t.isStringLiteral(key)) {
                  return (key as StringLiteral).value === 'trust';
                }

                if (t.isIdentifier(key)) {
                  return (key as Identifier).name === 'trust';
                }

                return;
              }) as ObjectProperty
            )?.value as ObjectExpression
          )?.properties[0] as ObjectProperty;

          const trustMode = (trustValue?.value as StringLiteral)?.value;
          const isTrusted = isChildComponentTrusted(
            {
              trustMode,
              path: src,
            },
            isComponentPathTrusted
          );

          children.push({
            isTrusted,
            path: src,
            trustMode,
          });

          // replace imported reference depending on the render mode
          // - sandboxed: dynamic <Component /> to be initialized when the current container's Component tree is rendered
          // - trusted: static Component references, derived from Component path, rendered within the current container's Component tree
          Component.name = isTrusted
            ? buildComponentFunctionName(src)
            : 'Component';

          // no value for `props.bwe`, create new object for metadata
          if (!propsExpressions.bwe) {
            const createdBweProp = t.objectExpression([]);
            props.properties.push(
              t.objectProperty(t.identifier('bwe'), createdBweProp)
            );
            propsExpressions.bwe = createdBweProp;
          }

          // inject the src prop
          const srcProperty = t.objectProperty(
            t.identifier('src'),
            t.stringLiteral(src)
          );

          propsExpressions.bwe!.properties = [
            ...propsExpressions.bwe!.properties,
            srcProperty,
            ...bweMeta.properties,
          ];
        }
      },
      ExportDeclaration(path: {
        node: ExportDefaultDeclaration | ExportNamedDeclaration;
        remove(): void;
        replaceWith(
          declaration: FunctionDeclaration | VariableDeclaration
        ): void;
        replaceWithMultiple(expressions: Expression[]): void;
      }) {
        if (t.isExportDefaultDeclaration(path.node)) {
          let component: Identifier | undefined;
          const declaration = (path.node as ExportDefaultDeclaration)
            .declaration as TSAsExpression | FunctionDeclaration | Identifier;

          if (t.isTSAsExpression(declaration)) {
            // export default X;
            component = (declaration as TSAsExpression)
              .expression as Identifier;

            path.remove();
          } else if (t.isFunctionDeclaration(declaration)) {
            // export default function X()
            component = (declaration as FunctionDeclaration).id as Identifier;
            if (!component) {
              // export default function ()
              component = t.identifier('BWEPlaceholderComponent');
              (declaration as FunctionDeclaration).id = component as Identifier;
            }

            path.replaceWith(declaration as FunctionDeclaration);
          } else if (t.isIdentifier(declaration)) {
            component = declaration as Identifier;
            path.remove();
          } else {
            console.error(`unsupported declaration type ${declaration?.type}`);
          }

          exports.default = component!.name;
        } else if (t.isExportNamedDeclaration(path.node)) {
          const { declaration } = path.node as ExportNamedDeclaration;
          if (t.isVariableDeclaration(declaration)) {
            const [exported] = (declaration as VariableDeclaration)
              .declarations;
            const exportedName = (exported.id as Identifier).name;
            exports.named.push(exportedName);
            if (exportedName === 'BWEComponent' && !exports.default) {
              exports.default = exportedName;
              console.warn(
                `Component ${componentPath} relies on a named export for "BWEComponent". In future versions, the module Component must be a default export.`
              );
            }

            path.replaceWith(declaration as VariableDeclaration);
          } else if (declaration === null) {
            path.remove();
          } else {
            console.error(`unsupported export type ${path.node.type}`);
          }
        }
      },
      ImportDeclaration(path: { node: ImportDeclaration; remove(): void }) {
        const {
          node: { source, specifiers },
        } = path;

        const importExpressions = specifiers.map((specifier) => {
          if (t.isImportSpecifier(specifier)) {
            const { imported, local } = specifier as ImportSpecifier;
            return {
              alias: local.name,
              isDestructured: true,
              reference: t.isIdentifier(imported)
                ? (imported as Identifier).name
                : (imported as StringLiteral).value,
            };
          } else if (t.isImportDefaultSpecifier(specifier)) {
            return {
              isDefault: true,
              reference: specifier.local.name,
            };
          } else if (t.isImportNamespaceSpecifier(specifier)) {
            return {
              isNamespace: true,
              alias: specifier.local.name,
            };
          }
        }) as ImportExpression[];

        const moduleImport = parseModuleImport(source.value, importExpressions);
        if (moduleImport.isBweModule) {
          const { reference } = moduleImport.imports.find(
            ({ isDefault }) => isDefault
          )!;
          componentReferences[reference!] = moduleImport;
        }

        imports.push(moduleImport);
        path.remove();
        return;
      },
    },
  });

  const { code } = Babel.transform(source, {
    presets: [Babel.availablePresets['typescript']],
    plugins: [
      [
        Babel.availablePlugins['transform-react-jsx'],
        { pragma: '__Preact.createElement' },
      ],
      transformComponents,
    ],
    filename: 'component.tsx', // name is not important, just the extension
  });

  if (!exports.default) {
    throw new Error(`${componentPath} missing default-exported Component`);
  }

  return { children, code, exports, imports };
}

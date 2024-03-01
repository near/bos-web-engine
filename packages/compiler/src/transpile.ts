import Babel from '@babel/standalone';
import type {
  ExportDefaultDeclaration,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  TSAsExpression,
} from '@babel/types';
import { TrustMode } from '@bos-web-engine/common';

import { buildComponentFunctionName } from './component';
import { parseModuleImport } from './import';
import type { ImportExpression, ModuleImport } from './types';

/**
 * Derive a BOS Component path from a relative import
 * @param componentPath poth of the Component importing another BOS Component via relative path
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
  { trustMode, path }: { trustMode: string; path: string },
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

export function transpileSource(
  componentPath: string,
  source: string,
  isRoot: boolean,
  isComponentPathTrusted?: (path: string) => boolean
) {
  const exports: { default: string } = { default: '' };
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
          arguments: [Identifier | StringLiteral, ObjectExpression | undefined];
          callee: { object: Identifier; property: Identifier };
        };
      }) {
        const {
          arguments: args,
          callee: { object, property },
        } = path.node;

        const isCreateElement =
          object?.name === '__Preact' && property?.name === 'createElement';
        const isElement = t.isStringLiteral(args[0]);
        if (!isCreateElement || isElement) {
          return;
        }

        let [Component, props] = args as [Identifier, ObjectExpression];

        if (t.isNullLiteral(props)) {
          props = t.objectExpression([]);
          path.node.arguments[1] = props;
        }

        const propsExpressions = props?.properties.reduce(
          (expressions, { key, value }: any) => {
            expressions[key.name] = value;
            return expressions;
          },
          {} as any
        ) as {
          id?: string;
          props?: ObjectExpression;
          trust?: ObjectExpression;
        };

        if (componentReferences[Component.name]) {
          const src = deriveComponentPath(
            componentPath,
            componentReferences[Component.name]
          );

          const trustValue = propsExpressions.trust
            ?.properties[0] as ObjectProperty;
          const trustMode =
            (trustValue?.value as StringLiteral)?.value || 'sandboxed';
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

          // use the derived Component path to set the "src" prop on <Component />
          if (!isTrusted) {
            // TODO remove ?.
            props?.properties.push(
              t.objectProperty(t.identifier('src'), t.stringLiteral(src))
            );
          }
        }
      },
      ExportDeclaration(path: {
        node: ExportDefaultDeclaration;
        replaceWithMultiple(expressions: Expression[]): void;
      }) {
        if (t.isExportDefaultDeclaration(path.node)) {
          exports.default = (
            (path.node.declaration as TSAsExpression).expression as Identifier
          ).name;
          path.replaceWithMultiple([
            t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier(exports.default),
                t.identifier('isRootComponent')
              ),
              t.booleanLiteral(isRoot)
            ),
            t.returnStatement(t.identifier(exports.default)),
          ]);
        }
      },
      ImportDeclaration(path: { node: ImportDeclaration; remove(): void }) {
        const {
          node: { source, specifiers },
        } = path;

        const importExpressions = specifiers.map((specifier) => {
          if (t.isImportSpecifier(specifier)) {
            // TODO differentiate/handle namespaced & side-effect imports
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

  return { children, code, exports, imports };
}

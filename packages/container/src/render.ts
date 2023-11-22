import type { ComponentChildren, VNode } from 'preact';

import type {
  BuildSafeProxyCallback,
  DispatchRenderEventCallback,
  PreactifyCallback,
  WebEngineMeta,
} from './types';
import { ComposeRenderMethodsCallback } from './types';

export const buildSafeProxy: BuildSafeProxyCallback = ({
  props,
  componentId,
}) => {
  return new Proxy(
    { ...props, __bweMeta: { componentId, isProxy: true } },
    {
      get(target, key) {
        try {
          return (target as any)[key];
        } catch {
          return undefined;
        }
      },
    }
  );
};

export const preactify: PreactifyCallback = ({
  node,
  createElement,
  Component,
}) => {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const { props, type } = node;
  if (!props) {
    return undefined;
  }

  // TODO handle other builtins
  const isComponent = !!props!.src?.match(/[0-9a-z._-]{5,}\/[0-9a-z._-]+/gi);
  const { children } = props;
  if (!children) {
    return undefined;
  }

  return createElement(
    isComponent ? Component : type,
    { ...props, key: node.key || props.key },
    Array.isArray(children)
      ? children.map((child) =>
          preactify({
            node: child,
            createElement: createElement,
            Component,
          })
        )
      : preactify({
          node: children,
          createElement: createElement,
          Component,
        })
  );
};

export const dispatchRenderEvent: DispatchRenderEventCallback = ({
  componentId,
  node,
  postComponentRenderMessage,
  serializeNode,
  trust,
}) => {
  const serializedNode = serializeNode({
    node,
    childComponents: [],
    parentId: componentId,
  });

  if (!serializedNode?.type) {
    return;
  }

  const { childComponents } = serializedNode;
  delete serializedNode.childComponents;

  try {
    postComponentRenderMessage({
      childComponents: childComponents || [],
      componentId: componentId,
      node: serializedNode,
      trust,
    });
  } catch (error) {
    console.warn(`failed to dispatch render for ${componentId}`, {
      error,
      serializedNode,
    });
  }
};

interface BOSComponentProps {
  id: string;
  src: string;
  __bweMeta: WebEngineMeta;
}

type BWEComponentNode = VNode<BOSComponentProps>;

interface PlaceholderNode {
  type: string;
  props: {
    id: string;
    className: string;
    children: ComponentChildren;
    'data-component-src': string;
  };
}

interface RenderedVNode extends VNode<any> {
  __k?: RenderedVNode[];
}

export const composeRenderMethods: ComposeRenderMethodsCallback = ({
  Fragment,
  Component,
  BWEComponent,
  dispatchRender,
}) => {
  const buildBWEComponentNode = (
    node: BWEComponentNode,
    children: ComponentChildren
  ): PlaceholderNode => {
    const { id, src, __bweMeta } = node.props;
    const childComponentId = [src, id, __bweMeta?.parentMeta?.componentId].join(
      '##'
    );

    return {
      type: 'div',
      props: {
        id: 'dom-' + childComponentId,
        className: 'bwe-component-container',
        children,
        'data-component-src': src,
      },
    };
  };

  const isBWEComponent = (node: VNode<any>) =>
    (typeof node.type === 'function' &&
      node.type?.name?.startsWith?.('BWEComponent')) ||
    false;

  function parseRenderedTree(
    node: RenderedVNode,
    renderedChildren?: RenderedVNode[],
    childIndex?: number
  ): VNode {
    if (!node || !renderedChildren) {
      return node;
    }

    if (node.type === Fragment) {
      const fragmentChildren = renderedChildren || [];
      if (
        fragmentChildren.length === 1 &&
        fragmentChildren[0]?.type === BWEComponent
      ) {
        return parseRenderedTree(
          {
            type: 'div',
            key: 'bwe-container-component',
            props: null,
          },
          fragmentChildren[0].__k
        );
      }

      return parseRenderedTree(
        { type: 'div', props: null, key: 'fragment-root' },
        renderedChildren
      );
    }

    const props =
      node.props && typeof node.props === 'object'
        ? Object.fromEntries(
            Object.entries(node.props).filter(([k]) => k !== 'children')
          )
        : node.props;

    if (typeof node.type === 'function' && node.type !== Component) {
      if (isBWEComponent(node) && node.type !== BWEComponent) {
        const componentNode = buildBWEComponentNode(
          node as BWEComponentNode,
          renderedChildren
        );

        return parseRenderedTree(
          {
            type: componentNode.type,
            props: componentNode.props,
            key: `bwe-component-${node.type.name}`,
          },
          renderedChildren
        );
      }

      return parseRenderedTree(
        {
          type: 'div',
          props: {
            ...props,
            children: [],
            'data-component-name': node.type.name,
          },
          key: `external-component-${node.type.name}`,
        },
        renderedChildren
      );
    }

    return {
      type: node.type,
      key: `${typeof node.type === 'function' ? node.type.name : node.type}-${
        childIndex || 0
      }`,
      props: {
        ...props,
        children: [renderedChildren]
          .flat()
          .filter((c) => !!c)
          .map((child, i) => {
            if (child.type) {
              return parseRenderedTree(child, child.__k, i);
            }

            return child.props;
          }),
      },
    };
  }

  const commit = (vnode: RenderedVNode) => {
    dispatchRender(
      parseRenderedTree(
        { type: vnode.type, props: vnode.props, key: 'root-component' },
        vnode.__k
      )
    );
  };

  return {
    commit,
  };
};

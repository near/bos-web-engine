import type {
  ComponentTrust,
  Props,
  WebEngineMeta,
} from '@bos-web-engine/common';
import type { ComponentChildren, ComponentType, VNode } from 'preact';

import type {
  BuildSafeProxyCallback,
  ComposeRenderMethodsCallback,
  ContainerComponent,
  Node,
} from './types';

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

type BOSComponentProps = Props & {
  __bweMeta: WebEngineMeta & {
    id: string;
    src: string;
    trust?: ComponentTrust;
  };
};

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

type DispatchRenderCallback = (vnode: VNode) => void;

export const composeRenderMethods: ComposeRenderMethodsCallback = ({
  componentId,
  isExternalComponent,
  isRootComponent,
  isComponent,
  isFragment,
  postComponentRenderMessage,
  serializeNode,
  trust,
}) => {
  const dispatchRender: DispatchRenderCallback = (node) => {
    const serializedNode = serializeNode({
      node: node as Node,
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
        componentId,
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

  const buildBWEComponentNode = (
    node: BWEComponentNode,
    children: ComponentChildren
  ): PlaceholderNode => {
    const { id, src, parentMeta } = node.props.__bweMeta;
    const childComponentId = [src, id, parentMeta?.componentId].join('##');

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

  function parseRenderedTree(
    node: RenderedVNode | null,
    renderedChildren?: Array<RenderedVNode | null>,
    childIndex?: number
  ): VNode | null | Array<VNode | null> {
    if (!node || !renderedChildren) {
      return node;
    }

    if (isFragment(node.type as ComponentType)) {
      const fragmentChildren = renderedChildren || [];
      if (
        fragmentChildren.length === 1 &&
        isRootComponent(fragmentChildren[0]?.type as ContainerComponent)
      ) {
        // this node is the root of a component defined in the container
        return parseRenderedTree(
          {
            type: 'div',
            key: 'bwe-container-component',
            props: null,
          },
          fragmentChildren[0]?.__k
        );
      } else {
        // Handling for nested or non-root fragments. This will flatten non-root fragments

        return fragmentChildren.map((child) => {
          // Return the text content directly if it's a text node
          if (typeof child?.props === 'string') {
            return child.props;
          }

          // For non-text nodes, parse the tree recursively
          return parseRenderedTree(child, child?.__k);
        }) as VNode[];
      }
    }

    const props =
      node.props && typeof node.props === 'object'
        ? Object.fromEntries(
            Object.entries(node.props).filter(([k]) => k !== 'children')
          )
        : node.props;

    if (typeof node.type === 'function' && !isComponent(node.type)) {
      const component = node.type as ContainerComponent;
      if (!isExternalComponent(component) && !isRootComponent(component)) {
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
            if (child?.type) {
              return parseRenderedTree(child, child?.__k, i);
            }

            return child?.props;
          }),
      },
    };
  }

  const commit = (vnode: RenderedVNode) => {
    dispatchRender(
      parseRenderedTree(
        { type: vnode.type, props: vnode.props, key: 'root-component' },
        vnode.__k
      ) as VNode
    );
  };

  return {
    commit,
  };
};

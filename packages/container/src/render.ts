import type { WebEngineMeta } from '@bos-web-engine/common';
import type { ComponentChildren, ComponentType, VNode } from 'preact';

import type {
  BuildSafeProxyCallback,
  ComposeRenderMethodsCallback,
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

type DispatchRenderCallback = (vnode: VNode) => void;

export const composeRenderMethods: ComposeRenderMethodsCallback = ({
  componentId,
  isRootComponent,
  isComponent,
  isFragment,
  isWidget, // TODO remove when <Widget /> no longer supported
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
  ): VNode | VNode[] {
    if (!node || !renderedChildren) {
      return node;
    }

    if (isFragment(node.type as ComponentType)) {
      const fragmentChildren = renderedChildren || [];
      if (
        fragmentChildren.length === 1 &&
        isRootComponent(fragmentChildren[0]?.type as ComponentType)
      ) {
        // this node is the root of a component defined in the container
        return parseRenderedTree(
          {
            type: 'div',
            key: 'bwe-container-component',
            props: null,
          },
          fragmentChildren[0].__k
        );
      }

      return renderedChildren.map((child) =>
        parseRenderedTree(child)
      ) as VNode[];
    }

    const props =
      node.props && typeof node.props === 'object'
        ? Object.fromEntries(
            Object.entries(node.props).filter(([k]) => k !== 'children')
          )
        : node.props;

    if (
      typeof node.type === 'function' &&
      !isComponent(node.type) &&
      !isWidget(node.type)
    ) {
      if (isBWEComponent(node) && !isRootComponent(node.type)) {
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
      ) as VNode
    );
  };

  return {
    commit,
  };
};

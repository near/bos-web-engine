import type { ComponentChildren, ComponentType, VNode } from 'preact';

import type {
  BWEComponentNode,
  ComposeRenderMethodsCallback,
  ContainerComponent,
  Node,
  PlaceholderNode,
} from './types';

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
    const {
      key,
      props: { id, bwe },
    } = node;
    const { src, parentMeta } = bwe;
    // TODO remove id fallback after dev migration
    const childComponentId = [src, key || id, parentMeta?.componentId].join(
      '##'
    );

    return {
      type: 'div',
      key: key || id, // TODO remove id fallback after dev migration
      props: {
        id: 'dom-' + childComponentId,
        className: 'bwe-component-container',
        children,
        'data-component-src': src!,
      },
    };
  };

  function parseRenderedTree(
    node: RenderedVNode | null,
    renderedChildren?: Array<RenderedVNode | null>
  ): VNode | null | Array<VNode | null> {
    if (!node || !renderedChildren) {
      return node;
    }

    const component = node.type as ContainerComponent;
    let rootComponentChildren = isRootComponent(component)
      ? renderedChildren
      : [];

    if (isFragment(node.type as ComponentType)) {
      const fragmentChildren = renderedChildren || [];
      if (
        fragmentChildren.length === 1 &&
        isRootComponent(fragmentChildren[0]?.type as ContainerComponent)
      ) {
        // this is the initial render of the container's root Component
        // set the Fragment's children as the root Component's children
        rootComponentChildren = fragmentChildren[0]!.__k as RenderedVNode[];
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

    if (rootComponentChildren.length) {
      return parseRenderedTree(
        {
          type: 'div',
          key: 'bwe-container-component',
          props: null,
        },
        rootComponentChildren
      );
    }

    const props =
      node.props && typeof node.props === 'object'
        ? Object.fromEntries(
            Object.entries(node.props).filter(([k]) => k !== 'children')
          )
        : node.props;

    // no need to wrap element types and <Component /> references
    if (typeof node.type !== 'function' || isComponent(node.type)) {
      return {
        type: node.type,
        key: node.key || props.id, // TODO remove id fallback after dev migration
        props: {
          ...props,
          children: [renderedChildren]
            .flat()
            .filter((c) => !!c)
            .map((child) => {
              if (child?.type) {
                return parseRenderedTree(child, child?.__k);
              }

              return child?.props;
            }),
        },
      };
    }

    // wrap external (e.g. imported from NPM package) Components
    if (isExternalComponent(component)) {
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

    // compose and render the trusted Component
    const componentNode = buildBWEComponentNode(
      node as BWEComponentNode,
      renderedChildren
    );

    return parseRenderedTree(componentNode, renderedChildren);
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

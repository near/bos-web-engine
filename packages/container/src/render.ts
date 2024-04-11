import { WebEngineMeta } from '@bos-web-engine/common';
import type { ComponentChildren, ComponentType, VNode } from 'preact';

import type {
  BWEComponentNode,
  ComposeRenderMethodsCallback,
  ContainerComponent,
  ElementRef,
  Node,
  PlaceholderNode,
} from './types';

interface RenderedVNode extends VNode<any> {
  __k?: RenderedVNode[];
}

type DispatchRenderCallback = (vnode: VNode) => void;

export const composeRenderMethods: ComposeRenderMethodsCallback = ({
  containerId,
  isExternalComponent,
  isRootComponent,
  isComponent,
  isFragment,
  postComponentRenderMessage,
  postDomMethodInvocationMessage,
  serializeNode,
  trust,
}) => {
  const elementRefs = new Map<HTMLElement, any>();

  const dispatchRender: DispatchRenderCallback = (node) => {
    const serializedNode = serializeNode({
      node: node as Node,
      childComponents: [],
      parentId: containerId,
    });

    if (!serializedNode?.type) {
      return;
    }

    const { childComponents } = serializedNode;
    delete serializedNode.childComponents;

    try {
      postComponentRenderMessage({
        childComponents: childComponents || [],
        containerId,
        node: serializedNode,
        trust,
      });
    } catch (error) {
      console.warn(`failed to dispatch render for ${containerId}`, {
        error,
        serializedNode,
      });
    }
  };

  const buildComponentId = (meta?: WebEngineMeta): string => {
    if (!meta) {
      return '';
    }

    return `${meta.src}##${meta.key || ''}##${buildComponentId(
      meta.parentMeta
    )}`;
  };

  const buildBWEComponentNode = (
    node: BWEComponentNode,
    children: ComponentChildren
  ): PlaceholderNode => {
    const {
      key,
      props: { bwe },
    } = node;
    const childComponentId = buildComponentId(bwe);

    return {
      type: 'div',
      key,
      props: {
        id: 'dom-' + childComponentId,
        className: 'bwe-component-container',
        children,
        'data-component-src': bwe.src!,
      },
    };
  };

  /**
   * Construct a record for tracking element refs
   * @param element HTML element bound to a Component via `ref`
   */
  function buildElementRef(element: HTMLElement): ElementRef {
    const id = window.crypto.randomUUID();
    return {
      id,
      proxy: new Proxy(element, {
        get(target: HTMLElement, p: string | symbol): any {
          const prop = target[p as keyof typeof target];
          if (typeof prop !== 'function') {
            return prop;
          }

          // replace methods with a wrapper function bound to the element that
          // posts a DOM method invocation message to the outer application
          function intercepted(...args: any[]) {
            postDomMethodInvocationMessage({
              args,
              containerId,
              id,
              method: p as string,
            });
            return (prop as Function).call(target, ...args);
          }

          return intercepted.bind(target);
        },
      }),
      ref: element,
    };
  }

  function parseRenderedTree(
    node: RenderedVNode | null,
    renderedChildren?: Array<RenderedVNode | null>
  ): VNode | null | Array<VNode | null> {
    if (!node || !renderedChildren) {
      return node;
    }

    /*
      for elements bound to `ref` instances, create a proxy object to forward
      DOM method invocations in the iframe to the outer application
     */
    if (node.ref) {
      // @ts-expect-error
      const element: HTMLElement = node.ref.current;
      if (!(element instanceof HTMLElement)) {
        console.error('unexpected ref type', element);
      }

      if (!elementRefs.has(element)) {
        elementRefs.set(element, buildElementRef(element));
      }

      const { id, proxy } = elementRefs.get(element)!;
      // @ts-expect-error
      node.ref.current = proxy;
      node.props['data-roc-ref-id'] = id;
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
        key: node.key,
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

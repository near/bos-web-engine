import type { ComponentChild, ComponentChildren, VNode } from 'preact';

import type {
  BuildSafeProxyCallback,
  DispatchRenderEventCallback,
  PreactifyCallback,
  Props,
  IsMatchingPropsCallback,
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

export const isMatchingProps: IsMatchingPropsCallback = (
  props,
  compareProps
) => {
  const getComparable = (p: Props) =>
    Object.entries(p)
      .sort(([aKey], [bKey]) => (aKey === bKey ? 0 : aKey > bKey ? 1 : -1))
      .filter(([k]) => k !== '__bweMeta')
      .map(([key, value]) => `${key}::${value?.toString()}`)
      .join(',');

  return getComparable(props) === getComparable(compareProps);
};

export const dispatchRenderEvent: DispatchRenderEventCallback = ({
  componentId,
  node,
  nodeRenders,
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

  function stringify(value: any): string {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.map(stringify).join(',');
    }

    if (typeof value === 'object') {
      return stringifyObject(value);
    }

    return value.toString();
  }

  function stringifyObject(obj: any): string {
    if (Array.isArray(obj) || typeof obj !== 'object') {
      return stringify(obj);
    }

    const sortedEntries = Object.entries(obj);
    sortedEntries.sort();
    return sortedEntries.reduce(
      (acc, [key, value]) => [acc, key, stringify(value)].join(':'),
      ''
    );
  }
  const stringifiedNode = stringifyObject(serializedNode);
  if (nodeRenders.get(componentId) === stringifiedNode) {
    return;
  }

  nodeRenders.set(componentId, stringifiedNode);
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
    console.warn('failed to dispatch render for ${id}', {
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

type ComponentNode = VNode<any>;
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
    // FIXME
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

  // find all Component leaf nodes in the given Preact node's Component tree
  const getComponentLeafNodes = (node: VNode): ComponentChild[] => {
    const children = node?.props?.children || [];
    if (typeof children !== 'object') {
      return [];
    }

    return [children]
      .flat()
      .filter((child) => child && (child as VNode).type !== Component)
      .reduce(
        (descendants: ComponentChild[], child) =>
          typeof (child as VNode).type === 'function'
            ? [...descendants, child]
            : [
                ...descendants,
                ...(!(child as VNode)?.props?.children
                  ? []
                  : getComponentLeafNodes(child as VNode)),
              ],
        []
      );
  };

  const buildComponentTree = (
    rootNode: VNode,
    componentTree: Map<ComponentNode, ComponentNode[]>
  ): VNode => {
    if (!rootNode || typeof rootNode !== 'object') {
      return rootNode;
    }

    const currentNode = isBWEComponent(rootNode)
      ? buildBWEComponentNode(
          rootNode as unknown as BWEComponentNode,
          componentTree.get(rootNode) || []
        )
      : rootNode;

    const children = [currentNode.props?.children || []]
      .flat()
      .map((componentChild) => {
        const child = componentChild as ComponentNode;
        // ignore non-Component children and Widget references (<Widget /> is serialized later)
        if (typeof child.type !== 'function' || child.type === Component) {
          return child;
        }

        const componentChildren = componentTree.get(child);
        if (isBWEComponent(child)) {
          return buildBWEComponentNode(child, componentChildren);
        }

        // external Preact Component
        return {
          type: 'div',
          props: {
            // id: child.props.id,
            className: 'preact-component-container',
            children: componentChildren,
          },
        };
      });

    return {
      ...currentNode,
      // FIXME
      key: '',
      props: {
        ...currentNode.props,
        children: [children]
          .flat()
          .map((child) =>
            buildComponentTree(child as ComponentNode, componentTree)
          ),
      },
    };
  };

  const componentRoots = new Map<VNode, VNode[]>();
  let remainingSubtrees = 0;
  let currentRoot: VNode | null = null;

  const RENDER_TIMEOUT_MS = 5;
  let renderTimer: number | null = null;

  const diffed = (vnode: VNode) => {
    // @ts-expect-error
    const parent = vnode.__ as VNode;

    // the emitted vnode output has a Preact Fragment at the root with a single child, BWEComponent
    // these are effectively wrappers around the BOS Component nodes; their emitted output is not relevant
    const firstChild = [vnode.props?.children].flat()[0] as VNode | undefined;
    const isRootFragment =
      vnode.type === Fragment && firstChild?.type === BWEComponent;

    const isRootComponent =
      vnode.type === BWEComponent && parent.type === Fragment;

    // if the parent Component is a function, the current vnode is a DOM root for a Component tree
    if (
      typeof parent?.type === 'function' &&
      !isRootFragment &&
      !isRootComponent
    ) {
      // a new Component DOM tree has been emitted, clear the timer
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }

      // set the root Component to the current parent
      if (!currentRoot) {
        currentRoot = parent;
      }

      // initialize the list of children under the current parent Component's node and add the current node
      if (!componentRoots.has(parent)) {
        componentRoots.set(parent, []);
      }
      componentRoots.get(parent)!.push(vnode);

      // add the number of Component leaf nodes in this node's tree
      remainingSubtrees += getComponentLeafNodes(vnode).length;

      const renderComponentSubtree = () => {
        dispatchRender(buildComponentTree(currentRoot!, componentRoots));
        componentRoots.clear();
        currentRoot = null;
      };

      const isRootChild = currentRoot === parent;
      if (remainingSubtrees && !isRootChild) {
        remainingSubtrees--;
        if (remainingSubtrees === 0) {
          renderComponentSubtree();
        }
      } else if (isRootChild) {
        // the number of root children is not known in advance, set a timeout
        // to proceed with the render if the current node is a root child
        // the timer will be cleared when the next node is emitted
        // @ts-expect-error
        renderTimer = setTimeout(renderComponentSubtree, RENDER_TIMEOUT_MS);
      }
    }
  };

  return {
    diffed,
  };
};

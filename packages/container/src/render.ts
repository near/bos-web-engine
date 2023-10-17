import {
  BuildSafeProxyCallback,
  DispatchRenderEventCallback,
  RenderContainerComponentCallback,
  PreactifyCallback,
  Props,
  IsMatchingPropsCallback,
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
  const isComponent = !!props!.src?.match(
    /[0-9a-z._-]{5,}\/widget\/[0-9a-z._-]+/gi
  );
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

export const renderContainerComponent: RenderContainerComponentCallback = ({
  stateUpdate,
  ContainerComponent,
  stateUpdates,
  createElement,
  render,
  componentId,
}) => {
  try {
    // TODO remove this kludge-y stopgap preventing State.update() calls on render from triggering cascading renders.
    //  This likely has unintended consequences for Components calling State.update() at render time, but that should
    //  be considered an antipattern to be replaced by a [useEffect] implementation.
    if (stateUpdate) {
      if (!stateUpdates.has(stateUpdate)) {
        stateUpdates.set(stateUpdate, []);
      }

      const updates = stateUpdates.get(stateUpdate) || [];
      stateUpdates.set(stateUpdate, [...updates, new Date().valueOf()]);
      if (updates.length > 5) {
        return;
      }
    }

    try {
      render(ContainerComponent, document.getElementById(componentId));
    } catch (e: unknown) {
      const error = e as Error;
      console.error(e, { componentId: `${componentId.split('##')[0]}` });
      return createElement(
        'div',
        {},
        `failed to load ${
          componentId.split('##')[0]
        }: ${error.toString()}\n\n ${error.stack}`
      );
    }
  } catch (e) {
    console.error(e, { componentId });
  }
};

export const dispatchRenderEvent: DispatchRenderEventCallback = ({
  componentId,
  node,
  nodeRenders,
  postComponentRenderMessage,
  postMessage,
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
      childComponents,
      componentId: componentId,
      node: serializedNode,
      postMessage,
      trust,
    });
  } catch (error) {
    console.warn('failed to dispatch render for ${id}', {
      error,
      serializedNode,
    });
  }
};

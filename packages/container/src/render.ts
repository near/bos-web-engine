import {
  BuiltinComponents,
  CallbackMap,
  ComponentProps,
  Node,
  NodeProps,
  SerializeNodeParams,
  SerializedNode,
  PreactifyCallback,
} from './types';

interface DispatchRenderEventParams {
  builtinComponents: BuiltinComponents;
  callbacks: CallbackMap;
  componentId: string;
  node: Node;
  nodeRenders: Map<string, string>;
  postComponentRenderMessage: (p: any) => void;
  preactRootComponentName: string;
  serializeNode: (p: SerializeNodeParams) => SerializedNode;
  trust: string;
}

export const preactify: PreactifyCallback = ({
  node,
  builtinPlaceholders,
  createElement,
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
  const { children } = props!;

  return createElement(
    isComponent ? builtinPlaceholders.Widget : type,
    { ...props, key: node.key || props.key },
    Array.isArray(children)
      ? children.map((child) =>
          preactify({
            node: child,
            builtinPlaceholders: builtinPlaceholders,
            createElement: createElement,
          })
        )
      : preactify({
          node: children,
          builtinPlaceholders: builtinPlaceholders,
          createElement: createElement,
        })
  );
};

type ComparableProps = NodeProps | ComponentProps;

export function isMatchingProps(
  props: ComparableProps,
  compareProps: ComparableProps
) {
  const getComparable = (p: ComparableProps) =>
    Object.entries(p)
      .sort(([aKey], [bKey]) => (aKey === bKey ? 0 : aKey > bKey ? 1 : -1))
      .filter(([k]) => k !== '__bweMeta')
      .map(([key, value]) => `${key}::${value?.toString()}`)
      .join(',');

  return getComparable(props) === getComparable(compareProps);
}

export function dispatchRenderEvent({
  builtinComponents,
  callbacks,
  componentId,
  node,
  nodeRenders,
  postComponentRenderMessage,
  preactRootComponentName,
  serializeNode,
  trust,
}: DispatchRenderEventParams) {
  const serializedNode = serializeNode({
    node,
    builtinComponents,
    childComponents: [],
    callbacks,
    parentId: componentId,
    preactRootComponentName,
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
      trust,
      node: serializedNode,
      componentId: componentId,
    });
  } catch (error) {
    console.warn('failed to dispatch render for ${id}', {
      error,
      serializedNode,
    });
  }
}

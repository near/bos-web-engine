import {
  BuiltinComponents,
  CallbackMap,
  Node,
  SerializeNodeParams,
  SerializedNode,
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

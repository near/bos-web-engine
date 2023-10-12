import type { VNode } from 'preact';

import { InitContainerParams, Node } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    decodeJsonString,
    deserializeProps,
    dispatchRenderEvent,
    getBuiltins,
    invokeCallback,
    invokeComponentCallback,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
    postMessage,
    preactify,
    serializeArgs,
    serializeNode,
    serializeProps,
  },
  context: {
    builtinPlaceholders,
    BWEComponent,
    callbacks,
    componentId,
    createElement,
    parentContainerId,
    preactHooksDiffed,
    preactRootComponentName,
    render,
    renderContainerComponent,
    requests,
    setProps,
    trust,
  },
}: InitContainerParams) {
  const builtinComponents = getBuiltins({ createElement });
  const stateUpdates = new Map<string, string[]>();

  const renderComponent = ({ stateUpdate }: { stateUpdate?: string } = {}) =>
    renderContainerComponent({
      BWEComponent,
      componentId,
      render,
      createElement,
      stateUpdate,
      stateUpdates,
    });

  // cache previous renders
  const nodeRenders = new Map<string, string>();

  const diffComponent = (vnode: VNode) => {
    // TODO this handler will fire for every descendant node rendered,
    //  could be a good way to optimize renders within a container without
    //  re-rendering the entire thing
    const [containerComponent] = (vnode.props?.children as any[]) || [];
    const isRootComponent =
      typeof vnode.type === 'function' &&
      vnode.type?.name === preactRootComponentName;
    if (containerComponent && isRootComponent) {
      dispatchRenderEvent({
        builtinComponents,
        callbacks,
        componentId: componentId,
        decodeJsonString,
        node: containerComponent(),
        nodeRenders,
        postComponentRenderMessage,
        postMessage,
        preactRootComponentName,
        serializeNode,
        serializeProps,
        trust,
      });
    }
    preactHooksDiffed?.(vnode);
  };

  const processEvent = buildEventHandler({
    buildRequest,
    builtinComponents,
    callbacks,
    componentId,
    decodeJsonString,
    deserializeProps,
    invokeCallback,
    invokeComponentCallback,
    parentContainerId,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postMessage,
    preactRootComponentName,
    renderComponent,
    renderDom: (node: Node) =>
      preactify({ node, builtinPlaceholders, createElement }),
    requests,
    serializeArgs,
    serializeNode,
    serializeProps,
    setProps,
  });

  return {
    diffComponent,
    processEvent,
    renderComponent,
  };
}

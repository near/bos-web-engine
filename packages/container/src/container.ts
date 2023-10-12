import type { VNode } from 'preact';

import { InitContainerParams, Node } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    deserializeProps,
    dispatchRenderEvent,
    invokeCallback,
    invokeComponentCallback,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
    preactify,
    serializeArgs,
    serializeNode,
  },
  context: {
    builtinComponents,
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
        node: containerComponent(),
        nodeRenders,
        postComponentRenderMessage,
        preactRootComponentName,
        serializeNode,
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
    deserializeProps,
    invokeCallback,
    invokeComponentCallback,
    parentContainerId,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    preactRootComponentName,
    renderComponent,
    renderDom: (node: Node) =>
      preactify({ node, builtinPlaceholders, createElement }),
    requests,
    serializeArgs,
    serializeNode,
    setProps,
  });

  return {
    diffComponent,
    processEvent,
    renderComponent,
  };
}

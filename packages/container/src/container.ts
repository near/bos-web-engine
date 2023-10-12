import { InitContainerParams, Node } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    deserializeProps,
    invokeCallback,
    invokeComponentCallback,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
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
    preactRootComponentName,
    render,
    renderContainerComponent,
    requests,
    setProps,
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
    processEvent,
    renderComponent,
  };
}

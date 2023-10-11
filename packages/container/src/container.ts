import { InitContainerParams, Node } from './types';

/**
 * Return an event handler function to be registered under `window.addEventHandler('message', fn(event))`
 * @param buildRequest Function to build an inter-Component asynchronous callback request
 * @param builtinComponents The set of Builtin Components provided by BOS Web Engine
 * @param callbacks The set of callbacks defined on the target Component
 * @param deserializeProps Function to deserialize props passed on the event
 * @param invokeCallback Function to execute the specified function in the current context
 * @param invokeComponentCallback Function to execute the specified function, either in the current context or another Component's
 * @param parentContainerId ID of the parent container
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param postCallbackResponseMessage Send callback execution result to calling Component via window.postMessage
 * @param preactRootComponentName Name of the Preact Fragment Component function (i.e. the root Component's name)
 * @param renderComponent Callback for rendering the Component
 * @param requests The set of inter-Component callback requests being tracked by the Component
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 * @param serializeNode Function to serialize Preact DOM trees passed to window.postMessage
 * @param setProps Callback for setting the Component's props
 * @param componentId ID of the target Component on which the
 */
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
    callbacks,
    componentId,
    createElement,
    parentContainerId,
    preactRootComponentName,
    renderComponent,
    requests,
    setProps,
  },
}: InitContainerParams) {
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
  };
}

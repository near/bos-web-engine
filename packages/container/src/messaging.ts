import type {
  CallbackRequest,
  PostMessageParams,
  ComponentCallbackInvocation,
  PostMessageComponentCallbackInvocationParams,
  ComponentCallbackResponse,
  PostMessageComponentCallbackResponseParams,
  ComponentRender,
  PostMessageComponentRenderParams,
} from './types';

export function buildRequest(): CallbackRequest {
  let resolver;
  let rejecter;
  const promise = new Promise((res, rej) => {
    resolver = res;
    rejecter = rej;
  });

  return {
    promise,
    rejecter,
    resolver,
  };
}

export function composeMessagingMethods() {
  function postMessage<T extends PostMessageParams>(message: T) {
    window.parent.postMessage(message, '*');
  }

  function postCallbackInvocationMessage({
    args,
    callbacks,
    componentId,
    method,
    requestId,
    serializeArgs,
    targetId,
  }: PostMessageComponentCallbackInvocationParams): void {
    postMessage<ComponentCallbackInvocation>({
      args: serializeArgs({ args, callbacks, componentId }),
      method,
      originator: componentId,
      requestId,
      targetId,
      type: 'component.callbackInvocation',
    });
  }

  function postCallbackResponseMessage({
    error,
    componentId,
    requestId,
    result,
    targetId,
  }: PostMessageComponentCallbackResponseParams): void {
    const serializedError =
      error && JSON.stringify(error, Object.getOwnPropertyNames(error));

    postMessage<ComponentCallbackResponse>({
      requestId,
      componentId,
      result: JSON.stringify({
        value: result,
        error: serializedError,
      }),
      targetId,
      type: 'component.callbackResponse',
    });
  }

  function postComponentRenderMessage({
    childComponents,
    componentId,
    node,
    trust,
  }: PostMessageComponentRenderParams): void {
    postMessage<ComponentRender>({
      childComponents,
      componentId,
      node,
      trust,
      type: 'component.render',
    });
  }

  return {
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
  };
}

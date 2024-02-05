import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
  PostMessageParams,
} from '@bos-web-engine/common';

import type {
  CallbackRequest,
  PostMessageComponentCallbackInvocationParams,
  PostMessageComponentCallbackResponseParams,
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
    containerId,
    method,
    requestId,
    serializeArgs,
    targetId,
  }: PostMessageComponentCallbackInvocationParams): void {
    postMessage<ComponentCallbackInvocation>({
      args: serializeArgs({ args, callbacks, containerId }),
      method,
      originator: containerId,
      requestId,
      targetId,
      type: 'component.callbackInvocation',
    });
  }

  function postCallbackResponseMessage({
    error,
    containerId,
    requestId,
    result,
    targetId,
  }: PostMessageComponentCallbackResponseParams): void {
    const serializedError =
      error && JSON.stringify(error, Object.getOwnPropertyNames(error));

    postMessage<ComponentCallbackResponse>({
      requestId,
      containerId,
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

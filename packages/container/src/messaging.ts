import type {
  ComponentCallbackInvocation,
  ComponentCallbackResponse,
  ComponentRender,
  DomMethodInvocation,
  PostMessageParams,
} from '@bos-web-engine/common';

import type {
  CallbackRequest,
  ComposeMessagingMethodsCallback,
  PostMessageComponentCallbackInvocationParams,
  PostMessageComponentCallbackResponseParams,
  PostMessageComponentRenderParams,
  PostMessageDomMethodInvocationParams,
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

export const composeMessagingMethods: ComposeMessagingMethodsCallback = () => {
  function postMessage<T extends PostMessageParams>(message: T) {
    window.parent.postMessage(message, '*');
  }

  function postCallbackInvocationMessage({
    args,
    containerId,
    method,
    requestId,
    serializeArgs,
    targetId,
  }: PostMessageComponentCallbackInvocationParams): void {
    postMessage<ComponentCallbackInvocation>({
      args: serializeArgs({ args, containerId }),
      method,
      containerId,
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
    containerId,
    node,
    trust,
  }: PostMessageComponentRenderParams): void {
    postMessage<ComponentRender>({
      childComponents,
      containerId,
      node,
      trust,
      type: 'component.render',
    });
  }

  function postDomMethodInvocationMessage({
    args,
    containerId,
    id,
    method,
  }: PostMessageDomMethodInvocationParams): void {
    postMessage<DomMethodInvocation>({
      args,
      containerId,
      id,
      method,
      type: 'component.domMethodInvocation',
    });
  }

  return {
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
    postDomMethodInvocationMessage,
  };
};

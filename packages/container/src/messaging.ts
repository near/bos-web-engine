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

export function postMessage<T extends PostMessageParams>(message: T) {
  window.parent.postMessage(message, '*');
}

export function postCallbackInvocationMessage({
  args,
  callbacks,
  method,
  requestId,
  serializeArgs,
  targetId,
  componentId,
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

export function postCallbackResponseMessage({
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

export function postComponentRenderMessage({
  childComponents,
  trust,
  node,
  componentId,
}: PostMessageComponentRenderParams): void {
  postMessage<ComponentRender>({
    childComponents,
    trust,
    node,
    type: 'component.render',
    componentId,
  });
}

import type {
  CallbackRequest,
  PostMessageOptions,
  PostMessageWidgetCallbackInvocation,
  PostMessageWidgetCallbackInvocationOptions,
  PostMessageWidgetCallbackResponse,
  PostMessageWidgetCallbackResponseOptions,
  PostMessageWidgetRender,
  PostMessageWidgetRenderOptions,
  PostMessageWidgetUpdate,
  PostMessageWidgetUpdateOptions,
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

export function postMessage<T extends PostMessageOptions>(message: T) {
  window.parent.postMessage(message, '*');
}

export function postCallbackInvocationMessage({
  args,
  callbacks,
  method,
  requestId,
  serializeArgs,
  targetId,
  widgetId,
}: PostMessageWidgetCallbackInvocationOptions): void {
  postMessage<PostMessageWidgetCallbackInvocation>({
    args: serializeArgs({ args, callbacks, widgetId }),
    method,
    originator: widgetId,
    requestId,
    targetId,
    type: 'widget.callbackInvocation',
  });
}

export function postCallbackResponseMessage({
  error,
  isComponent,
  requestId,
  result,
  targetId,
}: PostMessageWidgetCallbackResponseOptions): void {
  const serializedError = error && JSON.stringify(error, Object.getOwnPropertyNames(error));

  postMessage<PostMessageWidgetCallbackResponse>({
    isComponent,
    requestId,
    result: JSON.stringify({
      value: result,
      error: serializedError,
    }),
    targetId,
    type: 'widget.callbackResponse',
  });
}

export function postWidgetRenderMessage({
  childWidgets,
  node,
  widgetId,
}: PostMessageWidgetRenderOptions): void {
  postMessage<PostMessageWidgetRender>({
    childWidgets,
    node,
    type: 'widget.render',
    widgetId,
  });
}

export function postWidgetUpdateMessage({
  props,
}: PostMessageWidgetUpdateOptions): void {
  postMessage<PostMessageWidgetUpdate>({
    props,
    type: 'widget.update',
  });
}

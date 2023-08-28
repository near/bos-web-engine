import type {
  Args,
  InvokeCallbackOptions,
  InvokeWidgetCallbackOptions,
  PostMessageEvent,
  ProcessEventOptions,
} from './types';

/**
 * Execute the callback and return the value
 * @param args The arguments to the invoked callback
 * @param callback The function to execute
 */
export function invokeCallback({ args, callback }: InvokeCallbackOptions): any {
  if (args === undefined) {
    return callback();
  }

  // TODO real implementation for event passing
  // @ts-expect-error
  if (args?.event) {
    // @ts-expect-error
    return callback(args.event);
  }

  // @ts-expect-error
  return callback(...args);
}

/**
 * Invoke a callback declared within a Widget
 * @param args The arguments to the invoked callback
 * @param buildRequest Function to build an inter-Widget asynchronous callback request
 * @param callbacks The set of callbacks defined on the target Widget
 * @param method The name of the callback to be invoked
 * @param postCallbackInvocationMessage Request invocation on external Widget via window.postMessage
 * @param requests The set of inter-Widget callback requests being tracked by the Widget
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 * @param widgetId ID of the Widget invoking the method
 */
export function invokeWidgetCallback({
  args,
  buildRequest,
  callbacks,
  method,
  postCallbackInvocationMessage,
  requests,
  serializeArgs,
  widgetId,
}: InvokeWidgetCallbackOptions): any {
  // unknown method
  if (!callbacks[method]) {
    console.error(`No method ${method} on widget ${widgetId}`);
    return null;
  }

  // some arguments to this callback are methods on other Components
  // these must be replaced with wrappers invoking Component methods
  if (typeof args?.some === 'function' && args.some((arg: any) => arg.__widgetMethod)) {
    args = args.map((arg: any) => {
      const { __widgetMethod: widgetMethod } = arg;
      if (!widgetMethod) {
        return arg;
      }

      return (...childArgs: any[]) => {
        const requestId = window.crypto.randomUUID();
        requests[requestId] = buildRequest();

        postCallbackInvocationMessage({
          args: childArgs,
          callbacks,
          method: widgetMethod,
          requestId,
          serializeArgs,
          targetId: widgetMethod.split('::').slice(1).join('::'),
          widgetId,
        });
      };
    });
  }

  return invokeCallback({ args, callback: callbacks[method] });
}

/**
 * Return an event handler function to be registered under `window.addEventHandler('message', fn(event))`
 * @param buildRequest Function to build an inter-Widget asynchronous callback request
 * @param builtinComponents The set of Builtin Components provided by BOS Web Engine
 * @param callbacks The set of callbacks defined on the target Widget
 * @param deserializeProps Function to deserialize props passed on the event
 * @param postCallbackInvocationMessage Request invocation on external Widget via window.postMessage
 * @param postCallbackResponseMessage Send callback execution result to calling Widget via window.postMessage
 * @param renderDom Callback for rendering DOM within the widget
 * @param renderWidget Callback for rendering the Widget
 * @param requests The set of inter-Widget callback requests being tracked by the Widget
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 * @param serializeNode Function to serialize Preact DOM trees passed to window.postMessage
 * @param setProps Callback for setting the Widget's props
 * @param widgetId ID of the target Widget on which the
 */
export function buildEventHandler({
  buildRequest,
  builtinComponents,
  callbacks,
  deserializeProps,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  renderDom,
  renderWidget,
  requests,
  serializeArgs,
  serializeNode,
  setProps,
  widgetId,
}: ProcessEventOptions): Function {
  return function processEvent(event: PostMessageEvent) {
    let error: any = null;
    let result: any;
    let shouldRender = false;

    function invokeCallback({ args, method }: { args: Args, method: string }) {
      return invokeWidgetCallback({
        args,
        buildRequest,
        callbacks,
        method,
        postCallbackInvocationMessage,
        requests,
        serializeArgs,
        widgetId,
      });
    }

    function applyRecursivelyToComponents(target: any, cb: (n: any) => any): any {
      const isComponent = (c: any) =>  !!c
        && typeof c === 'object'
        && '__k' in c
        && '__' in c;

      if (isComponent(target)) {
        return cb(target);
      }

      if (Array.isArray(target)) {
        return target
          .map((i) => {
            if (!isComponent(i)) {
              return i;
            }

            return applyRecursivelyToComponents(i, cb);
          });
      }

      if (target && typeof target === 'object') {
        return Object.fromEntries(
          Object.entries(target)
            .map(([k, v]) => [k, applyRecursivelyToComponents(v, cb)])
        );
      }

      return target;
    }

    switch (event.data.type) {
        case 'widget.callbackInvocation': {
          let { args, method, originator, requestId } = event.data;
          try {
            result = invokeCallback({ args, method });
          } catch (e: any) {
            error = e;
          }

          result = applyRecursivelyToComponents(result, (n: any) => serializeNode({ builtinComponents, node: n, callbacks, parentId: method, childWidgets: [], index: 0 }))

          const postCallbackResponse = (value: any, error: any) => {
            if (requestId) {
              postCallbackResponseMessage({
                error,
                requestId,
                result: value,
                targetId: originator,
              });
            }
          }

          if (result?.then) {
            result
              .then((v: any) => postCallbackResponse(v, error))
              .catch((e: any) => postCallbackResponse(undefined, e));
          } else {
            postCallbackResponse(result, error);
          }
          break;
        }
        case 'widget.callbackResponse': {
          const { requestId, result } = event.data;
          if (!(requestId in requests)) {
            console.error(`No request found for request ${requestId}`);
            return;
          }

          if (!result) {
            console.error(`No response for request ${requestId}`);
            return;
          }

          const { rejecter, resolver } = requests[requestId];
          if (!rejecter || !resolver) {
            console.error(`No resolver set for request ${requestId}`);
            return;
          }

          let error: any;
          let value: any;
          try {
            ({ error, value } = JSON.parse(result));
          } catch (e) {
            console.error('Could not parse returned JSON', { error: e, result });
            return;
          }

          if (error) {
            console.error('External Widget callback failed', { error });
            // TODO reject w/ Error instance
            rejecter(error);
            return;
          }

          resolver(applyRecursivelyToComponents(value, renderDom));
          break;
        }
        case 'widget.domCallback': {
          let { args, method } = event.data;
          try {
            result = invokeCallback({ args, method });
            shouldRender = true; // TODO conditional re-render
          } catch (e: any) {
            error = e as Error;
          }
          break;
        }
        case 'widget.update': {
          shouldRender = setProps(deserializeProps({
            buildRequest,
            callbacks,
            postCallbackInvocationMessage,
            props: event.data.props,
            requests,
            widgetId,
          }));
          break;
        }
        default: {
          return;
        }
    }

    if (shouldRender) {
      renderWidget();
    }
  };
}

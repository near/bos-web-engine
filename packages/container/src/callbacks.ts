import type {
  InvokeCallbackParams,
  InvokeComponentCallbackParams,
} from './types';

/**
 * Execute the callback and return the value
 * @param args The arguments to the invoked callback
 * @param callback The function to execute
 */
export function invokeCallback({ args, callback }: InvokeCallbackParams): any {
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
 * Invoke a callback declared within a Component
 * @param args The arguments to the invoked callback
 * @param buildRequest Function to build an inter-Component asynchronous callback request
 * @param callbacks The set of callbacks defined on the target Component
 * @param componentId ID of the Component invoking the method
 * @param invokeCallback Function to execute the specified function in the current Component's context
 * @param method The name of the callback to be invoked
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param requests The set of inter-Component callback requests being tracked by the Component
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 */
export function invokeComponentCallback({
  args,
  buildRequest,
  callbacks,
  componentId,
  invokeCallback,
  method,
  postCallbackInvocationMessage,
  requests,
  serializeArgs,
}: InvokeComponentCallbackParams): any {
  // unknown method
  if (!callbacks[method]) {
    console.error(`No method ${method} on component ${componentId}`);
    return null;
  }

  // some arguments to this callback are methods on other Components
  // these must be replaced with wrappers invoking Component methods
  if (typeof args?.some === 'function' && args.some((arg: any) => arg.__componentMethod)) {
    args = args.map((arg: any) => {
      const { __componentMethod: componentMethod } = arg;
      if (!componentMethod) {
        return arg;
      }

      return (...childArgs: any[]) => {
        const requestId = window.crypto.randomUUID();
        requests[requestId] = buildRequest();

        postCallbackInvocationMessage({
          args: childArgs,
          callbacks,
          method: componentMethod,
          requestId,
          serializeArgs,
          targetId: componentMethod.split('::').slice(1).join('::'),
          componentId,
        });
      };
    });
  }

  return invokeCallback({ args, callback: callbacks[method] });
}

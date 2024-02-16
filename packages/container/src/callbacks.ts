import type {
  InvokeExternalCallbackParams,
  InvokeInternalCallbackParams,
} from './types';

/**
 * Execute the callback and return the value
 * @param args The arguments to the invoked callback
 * @param callback The function to execute
 */
export function invokeInternalCallback({
  args,
  callback,
}: InvokeInternalCallbackParams): any {
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
 * @param callbacks The set of callbacks defined on the target Component
 * @param containerId ID of the container invoking the method
 * @param initExternalCallbackInvocation Function to initialize a callback invocation request
 * @param invokeInternalCallback Function to execute the specified function in the current Component's context
 * @param method The name of the callback to be invoked
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 */
export function invokeExternalContainerCallback({
  args,
  callbacks,
  containerId,
  initExternalCallbackInvocation,
  invokeInternalCallback,
  method,
  postCallbackInvocationMessage,
  serializeArgs,
}: InvokeExternalCallbackParams): any {
  // unknown method
  if (!callbacks[method]) {
    console.error(`No method ${method} on container ${containerId}`);
    return null;
  }

  // some arguments to this callback are methods on other Components
  // these must be replaced with wrappers invoking Component methods
  if (
    typeof args?.some === 'function' &&
    args.some((arg: any) => arg?.callbackIdentifier)
  ) {
    args = args.map((arg: any) => {
      const { callbackIdentifier } = arg;
      if (!callbackIdentifier) {
        return arg;
      }

      return (...childArgs: any[]) => {
        const { invocationId } = initExternalCallbackInvocation();

        postCallbackInvocationMessage({
          args: childArgs,
          callbacks,
          containerId,
          method: callbackIdentifier,
          requestId: invocationId,
          serializeArgs,
          targetId: callbackIdentifier.split('::').slice(1).join('::'),
        });
      };
    });
  }

  return invokeInternalCallback({ args, callback: callbacks[method] });
}

/**
 * Invoke a method on the outer window application
 * @param args The arguments to the invoked callback
 * @param callbacks The set of callbacks defined on the target Component
 * @param containerId ID of the container invoking the method
 * @param initExternalCallbackInvocation Function to initialize a callback invocation request
 * @param invokeInternalCallback Function to execute the specified function in the current Component's context
 * @param method The name of the callback to be invoked
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 */
export function invokeApplicationCallback<T>({
  args,
  callbacks,
  containerId,
  initExternalCallbackInvocation,
  method,
  postCallbackInvocationMessage,
  serializeArgs,
}: InvokeExternalCallbackParams): Promise<T> {
  const { invocation, invocationId } = initExternalCallbackInvocation<T>();
  postCallbackInvocationMessage({
    args,
    callbacks,
    containerId,
    method,
    requestId: invocationId,
    serializeArgs,
    targetId: null,
  });

  return invocation;
}

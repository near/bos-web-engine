import type { PostMessageEvent, SerializedArgs } from '@bos-web-engine/common';

import type { ProcessEventParams } from './types';

/**
 * Return an event handler function to be registered under `window.addEventHandler('message', fn(event))`
 * @param buildRequest Function to build an inter-Component asynchronous callback request
 * @param callbacks The set of callbacks defined on the target Component
 * @param containerId ID of the container handling messages
 * @param deserializeProps Function to deserialize props passed on the event
 * @param invokeExternalContainerCallback Function to execute the specified function, either in the current context or another Component's
 * @param invokeInternalCallback Function to execute the specified function in the current context
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param postCallbackResponseMessage Send callback execution result to calling Component via window.postMessage
 * @param requests The set of inter-Component callback requests being tracked by the Component
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 * @param serializeNode Function to serialize Preact DOM trees passed to window.postMessage
 * @param updateProps Callback for setting the Component's props
 */
export function buildEventHandler({
  callbacks,
  containerId,
  deserializeArgs,
  deserializeProps,
  initExternalCallbackInvocation,
  invokeExternalContainerCallback,
  invokeInternalCallback,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  requests,
  serializeArgs,
  serializeNode,
  updateProps,
}: ProcessEventParams): Function {
  return function processEvent(event: PostMessageEvent) {
    let error: any = null;
    let result: any;

    function invokeCallbackFromEvent({
      args,
      method,
    }: {
      args: SerializedArgs;
      method: string;
    }) {
      const deserializedArgs = deserializeArgs({ args, containerId });
      return invokeExternalContainerCallback({
        args: deserializedArgs,
        callbacks,
        containerId,
        initExternalCallbackInvocation,
        invokeInternalCallback,
        method,
        postCallbackInvocationMessage,
        serializeArgs,
      });
    }

    function applyRecursivelyToComponents(
      target: any,
      cb: (n: any) => any
    ): any {
      const isComponent = (c: any) =>
        !!c && typeof c === 'object' && '__k' in c && '__' in c;

      if (isComponent(target)) {
        return cb(target);
      }

      if (Array.isArray(target)) {
        return target.map((i) => {
          if (!isComponent(i)) {
            return i;
          }

          return applyRecursivelyToComponents(i, cb);
        });
      }

      if (target && typeof target === 'object') {
        return Object.fromEntries(
          Object.entries(target).map(([k, v]) => [
            k,
            applyRecursivelyToComponents(v, cb),
          ])
        );
      }

      return target;
    }

    switch (event.data.type) {
      case 'component.callbackInvocation': {
        let { args, containerId, method, requestId } = event.data;
        try {
          result = invokeCallbackFromEvent({ args, method });
        } catch (e: any) {
          error = e;
        }

        result = applyRecursivelyToComponents(result, (n: any) =>
          serializeNode({
            node: n,
            parentId: method.split('::')[0],
            childComponents: [],
          })
        );

        const postCallbackResponse = (value: any, error: any) => {
          if (requestId) {
            postCallbackResponseMessage({
              error,
              containerId,
              requestId,
              result: value,
              targetId: containerId,
            });
          }
        };

        if (result?.then) {
          result
            .then((v: any) => postCallbackResponse(v, error))
            .catch((e: any) => postCallbackResponse(undefined, e));
        } else {
          postCallbackResponse(result, error);
        }
        break;
      }
      case 'component.callbackResponse': {
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
          console.error('External Component callback failed', { error });
          // TODO reject w/ Error instance
          rejecter(error);
          return;
        }

        resolver(value);
        break;
      }
      case 'component.domCallback': {
        let { args, method } = event.data;
        try {
          result = invokeCallbackFromEvent({ args, method });
          if (typeof result?.then === 'function') {
            result.catch((e: Error) =>
              console.error('DOM event handler async callback failed', e)
            );
          }
        } catch (e: any) {
          error = e as Error;
        }
        break;
      }
      case 'component.update': {
        updateProps(
          deserializeProps({
            containerId,
            props: event.data.props,
          })
        );
        break;
      }
      default: {
        return;
      }
    }

    if (error) {
      console.error(error);
    }
  };
}

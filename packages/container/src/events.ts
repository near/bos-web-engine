import type {
  PostMessageEvent,
  ProcessEventParams,
  SerializedArgs,
} from './types';

/**
 * Return an event handler function to be registered under `window.addEventHandler('message', fn(event))`
 * @param buildRequest Function to build an inter-Component asynchronous callback request
 * @param builtinComponents The set of Builtin Components provided by BOS Web Engine
 * @param callbacks The set of callbacks defined on the target Component
 * @param decodeJsonString Function for decoding encoded JSON strings
 * @param deserializeProps Function to deserialize props passed on the event
 * @param invokeCallback Function to execute the specified function in the current context
 * @param invokeComponentCallback Function to execute the specified function, either in the current context or another Component's
 * @param parentContainerId ID of the parent container
 * @param postCallbackInvocationMessage Request invocation on external Component via window.postMessage
 * @param postCallbackResponseMessage Send callback execution result to calling Component via window.postMessage
 * @param preactRootComponentName Name of the Preact Fragment Component function (i.e. the root Component's name)
 * @param renderDom Callback for rendering DOM within the component
 * @param renderComponent Callback for rendering the Component
 * @param requests The set of inter-Component callback requests being tracked by the Component
 * @param serializeArgs Function to serialize arguments passed to window.postMessage
 * @param serializeNode Function to serialize Preact DOM trees passed to window.postMessage
 * @param setProps Callback for setting the Component's props
 * @param componentId ID of the target Component on which the
 */
export function buildEventHandler({
  buildRequest,
  builtinComponents,
  callbacks,
  componentId,
  decodeJsonString,
  deserializeProps,
  invokeCallback,
  invokeComponentCallback,
  parentContainerId,
  postCallbackInvocationMessage,
  postCallbackResponseMessage,
  postMessage,
  preactRootComponentName,
  renderDom,
  renderComponent,
  requests,
  serializeArgs,
  serializeNode,
  serializeProps,
  setProps,
}: ProcessEventParams): Function {
  return function processEvent(event: PostMessageEvent) {
    let error: any = null;
    let result: any;
    let shouldRender = false;

    function invokeCallbackFromEvent({
      args,
      method,
    }: {
      args: SerializedArgs;
      method: string;
    }) {
      if (!parentContainerId) {
        console.error(`no parent container for ${componentId}`);
        return;
      }

      return invokeComponentCallback({
        args,
        buildRequest,
        callbacks,
        componentId,
        invokeCallback,
        method,
        postCallbackInvocationMessage,
        requests,
        serializeArgs,
        targetId: parentContainerId,
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
        let { args, method, originator, requestId } = event.data;
        try {
          result = invokeCallbackFromEvent({ args, method });
        } catch (e: any) {
          error = e;
        }

        result = applyRecursivelyToComponents(result, (n: any) =>
          serializeNode({
            builtinComponents,
            node: n,
            callbacks,
            parentId: method,
            childComponents: [],
            preactRootComponentName,
            decodeJsonString,
            serializeProps,
          })
        );

        const postCallbackResponse = (value: any, error: any) => {
          if (requestId) {
            postCallbackResponseMessage({
              error,
              componentId,
              postMessage,
              requestId,
              result: value,
              targetId: originator,
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

        resolver(applyRecursivelyToComponents(value, renderDom));
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

          shouldRender = true; // TODO conditional re-render
        } catch (e: any) {
          error = e as Error;
        }
        break;
      }
      case 'component.update': {
        shouldRender = setProps(
          deserializeProps({
            buildRequest,
            callbacks,
            componentId,
            parentContainerId,
            postCallbackInvocationMessage,
            postMessage,
            props: event.data.props,
            requests,
            serializeArgs,
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

    if (shouldRender) {
      renderComponent();
    }
  };
}

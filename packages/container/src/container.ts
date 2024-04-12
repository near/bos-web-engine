import type {
  InvokeApplicationCallbackParams,
  Props,
} from '@bos-web-engine/common';

import type { CallbackRequest, InitContainerParams } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    composeMessagingMethods,
    composeRenderMethods,
    composeSerializationMethods,
    invokeApplicationCallback,
    invokeExternalContainerCallback,
    invokeInternalCallback,
  },
  context: {
    Component,
    componentPropsJson,
    containerId,
    Fragment,
    parentContainerId,
    trust,
    updateContainerProps,
  },
}: InitContainerParams) {
  const callbacks: { [key: string]: Function } = {};
  const requests: { [key: string]: CallbackRequest } = {};

  const initExternalCallbackInvocation = () => {
    const invocationId = window.crypto.randomUUID();
    requests[invocationId] = buildRequest();
    return { invocationId, invocation: requests[invocationId].promise };
  };

  const {
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
    postDomMethodInvocationMessage,
  } = composeMessagingMethods();

  const { deserializeArgs, deserializeProps, serializeArgs, serializeNode } =
    composeSerializationMethods({
      callbacks,
      initExternalCallbackInvocation,
      isComponent: (c) => c === Component,
      parentContainerId,
      postCallbackInvocationMessage,
    });

  const { commit } = composeRenderMethods({
    containerId,
    isComponent: (c) => c === Component,
    isExternalComponent: (c) => !('isRootContainerComponent' in c),
    isFragment: (c) => c === Fragment,
    isRootComponent: (c) => !!c?.isRootContainerComponent,
    postComponentRenderMessage,
    postDomMethodInvocationMessage,
    serializeArgs,
    serializeNode,
    trust,
  });

  const isMatchingProps = (props: Props, compareProps: Props) => {
    const getComparable = (p: Props) =>
      Object.entries(p)
        .sort(([aKey], [bKey]) => (aKey === bKey ? 0 : aKey > bKey ? 1 : -1))
        .filter(([k]) => k !== 'bwe')
        .map(([key, value]) => `${key}::${value?.toString()}`)
        .join(',');

    return getComparable(props) === getComparable(compareProps);
  };

  const processEvent = buildEventHandler({
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
    updateProps: (newProps) =>
      updateContainerProps((props: Props) => {
        /* `props` is actually a proxy */
        if (isMatchingProps({ ...props }, newProps)) {
          return props;
        }

        const updatedProps = { ...props, ...newProps };
        if (!updatedProps.bwe) {
          updatedProps.bwe = {};
        }
        updatedProps.bwe.componentId = containerId;

        return updatedProps;
      }),
  });

  const deserializedProps = deserializeProps({
    containerId,
    props: componentPropsJson,
  });

  const props = {
    ...deserializedProps,
    bwe: {
      ...deserializedProps,
      componentId: containerId,
    },
  };

  return {
    callApplicationMethod({ args, method }: InvokeApplicationCallbackParams) {
      return invokeApplicationCallback({
        args,
        callbacks,
        containerId,
        initExternalCallbackInvocation,
        invokeInternalCallback,
        method,
        postCallbackInvocationMessage,
        serializeArgs,
      });
    },
    commit,
    processEvent,
    props,
  };
}

import type { Props } from '@bos-web-engine/common';

import type { CallbackRequest, InitContainerParams } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    buildSafeProxy,
    composeMessagingMethods,
    composeRenderMethods,
    composeSerializationMethods,
    invokeExternalContainerCallback,
    invokeInternalCallback,
  },
  context: {
    BWEComponent,
    Component,
    componentId,
    componentPropsJson,
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
    componentId,
    isComponent: (c) => c === Component,
    isFragment: (c) => c === Fragment,
    isRootComponent: (c) => c === BWEComponent,
    postComponentRenderMessage,
    serializeNode,
    trust,
  });

  const isMatchingProps = (props: Props, compareProps: Props) => {
    const getComparable = (p: Props) =>
      Object.entries(p)
        .sort(([aKey], [bKey]) => (aKey === bKey ? 0 : aKey > bKey ? 1 : -1))
        .filter(([k]) => k !== '__bweMeta')
        .map(([key, value]) => `${key}::${value?.toString()}`)
        .join(',');

    return getComparable(props) === getComparable(compareProps);
  };

  const processEvent = buildEventHandler({
    callbacks,
    containerId: componentId,
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

        return buildSafeProxy({
          componentId,
          props: {
            ...props,
            ...newProps,
          },
        });
      }),
  });

  const props = buildSafeProxy({
    componentId,
    props: deserializeProps({
      containerId: componentId,
      props: componentPropsJson,
    }),
  });

  return {
    commit,
    processEvent,
    props,
  };
}

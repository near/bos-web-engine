import type { CallbackRequest, InitContainerParams, Props } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    buildSafeProxy,
    composeMessagingMethods,
    composeRenderMethods,
    composeSerializationMethods,
    invokeCallback,
    invokeComponentCallback,
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
    Widget, // TODO remove when <Widget /> no longer supported
  },
}: InitContainerParams) {
  const callbacks: { [key: string]: Function } = {};
  const requests: { [key: string]: CallbackRequest } = {};

  const {
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
  } = composeMessagingMethods();

  const { deserializeProps, serializeArgs, serializeNode } =
    composeSerializationMethods({
      buildRequest,
      callbacks,
      isComponent: (c) => c === Component,
      isWidget: (c) => c === Widget, // TODO remove when <Widget /> no longer supported
      parentContainerId,
      postCallbackInvocationMessage,
      requests,
    });

  const { commit } = composeRenderMethods({
    componentId,
    isComponent: (c) => c === Component,
    isFragment: (c) => c === Fragment,
    isRootComponent: (c) => c === BWEComponent,
    isWidget: (c) => c === Widget, // TODO remove when <Widget /> no longer supported
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
    buildRequest,
    callbacks,
    componentId,
    deserializeProps,
    invokeCallback,
    invokeComponentCallback,
    parentContainerId,
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
      componentId,
      props: componentPropsJson,
    }),
  });

  return {
    commit,
    processEvent,
    props,
  };
}

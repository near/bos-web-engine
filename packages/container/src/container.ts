import type {
  CallbackRequest,
  InitContainerParams,
  Node,
  Props,
} from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    buildSafeProxy,
    composeMessagingMethods,
    composeRenderMethods,
    composeSerializationMethods,
    dispatchRenderEvent,
    invokeCallback,
    invokeComponentCallback,
    isMatchingProps,
    preactify,
  },
  context: {
    BWEComponent,
    Component,
    componentId,
    componentPropsJson,
    createElement,
    Fragment,
    parentContainerId,
    trust,
    updateContainerProps,
  },
}: InitContainerParams) {
  const callbacks: { [key: string]: Function } = {};
  const requests: { [key: string]: CallbackRequest } = {};

  const {
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
  } = composeMessagingMethods();

  const { deserializeProps, serializeArgs, serializeNode, serializeProps } =
    composeSerializationMethods({
      buildRequest,
      callbacks,
      parentContainerId,
      postCallbackInvocationMessage,
      requests,
    });

  // cache previous renders
  const nodeRenders = new Map<string, string>();

  const dispatchRender = (vnode: Node) => {
    dispatchRenderEvent({
      callbacks,
      componentId,
      node: vnode,
      nodeRenders,
      postComponentRenderMessage,
      serializeNode,
      serializeProps,
      trust,
    });
  };

  const { diffed } = composeRenderMethods({
    BWEComponent,
    Component,
    // @ts-expect-error FIXME signature types
    dispatchRender,
    Fragment,
  });

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
    renderDom: (node: Node) => preactify({ node, createElement, Component }),
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
    diffed,
    dispatchRender,
    processEvent,
    props,
  };
}

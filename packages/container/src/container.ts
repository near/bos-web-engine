import type { VNode } from 'preact';

import { CallbackRequest, InitContainerParams, Node } from './types';

export function initContainer({
  containerMethods: {
    buildEventHandler,
    buildRequest,
    buildSafeProxy,
    decodeJsonString,
    deserializeProps,
    dispatchRenderEvent,
    getBuiltins,
    invokeCallback,
    invokeComponentCallback,
    postCallbackInvocationMessage,
    postCallbackResponseMessage,
    postComponentRenderMessage,
    postMessage,
    preactify,
    serializeArgs,
    serializeNode,
    serializeProps,
  },
  context: {
    builtinPlaceholders,
    BWEComponent,
    callbacks,
    componentId,
    createElement,
    componentPropsJson,
    parentContainerId,
    preactHooksDiffed,
    preactRootComponentName,
    render,
    renderContainerComponent,
    setProps,
    trust,
  },
}: InitContainerParams) {
  const builtinComponents = getBuiltins({ createElement });
  const stateUpdates = new Map<string, string[]>();
  const requests: { [key: string]: CallbackRequest } = {};

  const renderComponent = ({ stateUpdate }: { stateUpdate?: string } = {}) =>
    renderContainerComponent({
      BWEComponent,
      componentId,
      render,
      createElement,
      stateUpdate,
      stateUpdates,
    });

  // cache previous renders
  const nodeRenders = new Map<string, string>();

  const diffComponent = (vnode: VNode) => {
    // TODO this handler will fire for every descendant node rendered,
    //  could be a good way to optimize renders within a container without
    //  re-rendering the entire thing
    const [containerComponent] = (vnode.props?.children as any[]) || [];
    const isRootComponent =
      typeof vnode.type === 'function' &&
      vnode.type?.name === preactRootComponentName;

    if (containerComponent && isRootComponent) {
      dispatchRenderEvent({
        builtinComponents,
        callbacks,
        componentId: componentId,
        decodeJsonString,
        node: containerComponent(),
        nodeRenders,
        postComponentRenderMessage,
        postMessage,
        preactRootComponentName,
        serializeNode,
        serializeProps,
        trust,
      });
    }
    preactHooksDiffed?.(vnode);
  };

  const processEvent = buildEventHandler({
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
    renderComponent,
    renderDom: (node: Node) =>
      preactify({ node, builtinPlaceholders, createElement }),
    requests,
    serializeArgs,
    serializeNode,
    serializeProps,
    setProps,
  });

  const props = buildSafeProxy({
    componentId,
    props: deserializeProps({
      buildRequest,
      callbacks,
      componentId,
      parentContainerId,
      postCallbackInvocationMessage,
      postMessage,
      props: JSON.parse(
        `${componentPropsJson.replace(/'/g, "\\'").replace(/\\"/g, '\\\\"')}`
      ),
      requests,
      serializeArgs,
    }),
  });

  // TODO remove debug value
  const context = buildSafeProxy({
    componentId,
    props: {
      // @ts-expect-error FIXME
      accountId: props.accountId || 'andyh.near',
    },
  });

  function asyncFetch(url: string, options: RequestInit) {
    return fetch(url, options).catch(console.error);
  }

  const React = {
    Fragment: 'div',
  };
  function fadeIn() {}
  function slideIn() {}
  let minWidth;

  const styled = new Proxy(
    {},
    {
      get(_, property: string) {
        return (/*css: string*/) => {
          return property;
        };
      },
    }
  );

  return {
    /* VM compatibility TODO determine what to keep */
    asyncFetch,
    fadeIn,
    minWidth,
    React,
    slideIn,
    styled,

    /* Web Engine core */
    context,
    diffComponent,
    processEvent,
    props,
    renderComponent,
  };
}

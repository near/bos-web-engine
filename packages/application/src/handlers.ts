import React from 'react';

import { postMessageToComponentIframe } from './component-container';
import { createChildElements, createElement } from './react';
import type {
  CallbackInvocationHandlerParams,
  CallbackResponseHandlerParams,
  RenderHandlerParams,
} from './types';

export function onCallbackInvocation({
  data,
}: CallbackInvocationHandlerParams) {
  /*
    a component has invoked a callback passed to it as props by its parent component
    post a component callback message to the parent iframe
  */
  const { args, method, originator, requestId, targetId } = data;
  postMessageToComponentIframe({
    id: targetId,
    message: {
      args,
      method,
      originator,
      requestId,
      targetId,
      type: 'component.callbackInvocation',
    },
    targetOrigin: '*',
  });
}

export function onCallbackResponse({
  data,
}: CallbackResponseHandlerParams) {
  /*
    a component has executed a callback invoked from another component
    return the value of the callback execution to the calling component
  */
  const { requestId, result, targetId } = data;
  postMessageToComponentIframe({
    id: targetId,
    message: {
      result,
      requestId,
      targetId,
      type: 'component.callbackResponse',
    },
    targetOrigin: '*',
  });
}

interface ChildComponent {
  componentId: string;
  props: any;
  source: string;
  isTrusted: boolean;
}

export function onRender({
  data,
  isDebug = false,
  getComponentRenderCount,
  componentUpdated,
  mountElement,
  isComponentLoaded,
  loadComponent,
}: RenderHandlerParams) {
  /* a component has been rendered and is ready to be updated in the outer window */
  const { componentId, childComponents, node } = data;
  const { children, ...props } = node?.props || { children: [] };

  const componentChildren = createChildElements({ children, depth: 0, parentId: componentId });
  const element = createElement({
    children: [
      ...(isDebug ? [
        React.createElement(
          'span',
          { className: 'dom-label' },
          `[${componentId.split('##')[0]} (${getComponentRenderCount(componentId)})]`
        ),
        React.createElement('br'),
      ] : []),
      ...(Array.isArray(componentChildren) ? componentChildren : [componentChildren]),
    ],
    id: componentId,
    props: isDebug ? { ...props, className: 'iframe' } : props,
    type: node.type,
  });
  mountElement({ componentId, element });
  componentUpdated({ props, componentId });

  childComponents.forEach(({ componentId: childComponentId, props: componentProps, source, isTrusted }: ChildComponent) => {
    /*
      a new Component is being rendered by a parent Component, either:
      - this Component is being loaded for the first time
      - the parent Component has updated and is re-rendering this Component
    */
    if (!isComponentLoaded(childComponentId)) {
      /* component code has not yet been loaded, add to cache and load */
      loadComponent({
        componentId: childComponentId,
        componentPath: source,
        isTrusted,
        parentId: componentId,
        props: componentProps,
        renderCount: 0,
      });
    } else {
      /* component iframe is already loaded, post update message to iframe */
      componentUpdated({ props: componentProps, componentId: childComponentId });
      postMessageToComponentIframe({
        id: childComponentId,
        message: {
          props: componentProps,
          type: 'component.update',
        },
        targetOrigin: '*',
      });
    }
  });
}

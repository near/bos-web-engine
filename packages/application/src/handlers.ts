import React from 'react';

import { createChildElements, createElement } from './react';
import type {
  CallbackInvocationHandlerOptions,
  CallbackResponseHandlerOptions,
  RenderHandlerOptions,
} from './types';
import { postMessageToWidgetIframe } from './widget-container';

export function onCallbackInvocation({
  data,
}: CallbackInvocationHandlerOptions) {
  /*
    a widget has invoked a callback passed to it as props by its parent widget
    post a widget callback message to the parent iframe
  */
  const { args, method, originator, requestId, targetId } = data;
  postMessageToWidgetIframe({
    id: targetId,
    message: {
      args,
      method,
      originator,
      requestId,
      targetId,
      type: 'widget.callbackInvocation',
    },
    targetOrigin: '*',
  });
}

export function onCallbackResponse({
  data,
}: CallbackResponseHandlerOptions) {
  /*
    a widget has executed a callback invoked from another widget
    return the value of the callback execution to the calling widget
  */
  const { requestId, result, targetId } = data;
  postMessageToWidgetIframe({
    id: targetId,
    message: {
      result,
      requestId,
      targetId,
      type: 'widget.callbackResponse',
    },
    targetOrigin: '*',
  });
}

export function onRender({
  data,
  isDebug = false,
  getComponentRenderCount,
  markWidgetUpdated,
  mountElement,
  isComponentLoaded,
  loadComponent,
}: RenderHandlerOptions) {
  /* a widget has been rendered and is ready to be updated in the outer window */
  const { widgetId, childWidgets, node } = data;
  const { children, ...props } = node?.props || { children: [] };

  const componentChildren = createChildElements({ children, depth: 0, parentId: widgetId });
  const element = createElement({
    children: [
      ...(isDebug ? [
        React.createElement('span', { className: 'dom-label' }, `[${widgetId.split('##')[0]} (${getComponentRenderCount(widgetId)})]`),
        React.createElement('br'),
      ] : []),
      ...(Array.isArray(componentChildren) ? componentChildren : [componentChildren]),
    ],
    id: widgetId,
    props: isDebug ? { ...props, className: 'iframe' } : props,
    type: node.type,
  });
  mountElement({ widgetId, element });
  markWidgetUpdated({ props, widgetId });

  childWidgets.forEach(({ widgetId: childWidgetId, props: widgetProps, source, isTrusted }: { widgetId: string, props: any, source: string, isTrusted: boolean }) => {
    /*
      a new Component is being rendered by a parent Component, either:
      - this Component is being loaded for the first time
      - the parent Component has updated and is re-rendering this Component
    */
    if (!isComponentLoaded(childWidgetId)) {
      /* widget code has not yet been loaded, add to cache and load */
      loadComponent({
        componentId: childWidgetId,
        componentPath: source,
        isTrusted,
        parentId: widgetId,
        props: widgetProps,
        renderCount: 0,
      });
    } else {
      /* widget iframe is already loaded, post update message to iframe */
      markWidgetUpdated({ props: widgetProps, widgetId: childWidgetId });
      postMessageToWidgetIframe({
        id: childWidgetId,
        message: {
          props: widgetProps,
          type: 'widget.update',
        },
        targetOrigin: '*',
      });
    }
  });
}

import type { ComponentTrust } from '@bos-web-engine/common';
import React from 'react';

import { sendMessage } from './container';
import { createChildElements, createElement } from './react';
import type {
  CallbackInvocationHandlerParams,
  CallbackResponseHandlerParams,
  RenderHandlerParams,
} from './types';

export function onCallbackInvocation({
  data,
  onMessageSent,
}: CallbackInvocationHandlerParams) {
  /*
    a component has invoked a callback passed to it as props by its parent component
    post a component callback message to the parent iframe
  */
  const { args, method, originator, requestId, targetId } = data;
  sendMessage({
    componentId: targetId!,
    message: {
      args,
      method,
      originator,
      requestId,
      targetId,
      type: 'component.callbackInvocation',
    },
    onMessageSent,
  });
}

export function onCallbackResponse({
  data,
  onMessageSent,
}: CallbackResponseHandlerParams) {
  /*
    a component has executed a callback invoked from another component
    return the value of the callback execution to the calling component
  */
  const { requestId, result, targetId, containerId } = data;
  sendMessage({
    componentId: targetId,
    message: {
      containerId,
      result,
      requestId,
      targetId,
      type: 'component.callbackResponse',
    },
    onMessageSent,
  });
}

interface ChildComponent {
  componentId: string;
  props: any;
  source: string;
  trust: ComponentTrust;
}

export function onRender({
  data,
  debug,
  mountElement,
  isComponentLoaded,
  loadComponent,
  getContainerRenderCount,
  onMessageSent,
}: RenderHandlerParams) {
  /* a component has been rendered and is ready to be updated in the outer window */
  const { componentId, childComponents, node } = data;
  const { children, ...props } = node?.props || { children: [] };

  const componentChildren = createChildElements({
    children,
    depth: 0,
    parentId: componentId,
    onMessageSent,
  });
  const element = createElement({
    children: [
      ...(debug?.showContainerBoundaries
        ? [
            React.createElement('div', { className: 'dom-label' }, [
              `[${
                componentId.split('##')[0].split('/')[1]
              } (${getContainerRenderCount(componentId)})]`,
            ]),
          ]
        : []),
      ...[componentChildren].flat(),
    ],
    id: componentId,
    props,
    type: node.type,
    onMessageSent,
  });
  mountElement({ componentId, element });

  childComponents.forEach(
    ({
      componentId: childComponentId,
      props: componentProps,
      source,
      trust,
    }: ChildComponent) => {
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
          trust,
          parentId: componentId,
          props: componentProps,
          renderCount: 0,
        });
      } else {
        /* component iframe is already loaded, post update message to iframe */
        sendMessage({
          componentId: childComponentId,
          onMessageSent,
          message: {
            props: componentProps,
            componentId: childComponentId,
            type: 'component.update',
          },
        });
      }
    }
  );
}

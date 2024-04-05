import type { ContainerPayload } from '@bos-web-engine/common';
import type { ComponentCompilerRequest } from '@bos-web-engine/compiler';
import { useSocial } from '@bos-web-engine/social-db';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import React, { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { getAppDomId } from '../container';
import {
  onApplicationMethodInvocation,
  onCallbackInvocation,
  onCallbackResponse,
  onRender,
} from '../handlers';
import type {
  BWEMessage,
  ComponentDOMElement,
  WebEngineDebug,
  WebEngineHooks,
} from '../types';

interface CompilerWorker extends Omit<Worker, 'postMessage'> {
  postMessage(compilerRequest: ComponentCompilerRequest): void;
}

interface UseComponentTreeParams {
  addComponent: (componentId: string, component: any) => void;
  compiler: CompilerWorker | null;
  components: { [p: string]: any };
  debug?: WebEngineDebug;
  getComponentRenderCount: (componentId: string) => number;
  hooks?: WebEngineHooks;
}

/**
 * Manage the Component tree DOM for a set of containers
 * @param compiler Compiler web worker responsible for fetching and parsing Components
 * @param debug debugging options
 * @param hooks callbacks to be invoked upon specific actions
 * @param components set of active iframe containers
 * @param addComponent callback to add a new iframe container (i.e. rendering a sandboxed child)
 * @param getComponentRenderCount callback to get the number of renders for a given container
 */
export function useComponentTree({
  compiler,
  debug,
  hooks,
  components,
  addComponent,
  getComponentRenderCount,
}: UseComponentTreeParams) {
  const { wallet } = useWallet();
  const { social } = useSocial();
  const domRoots: MutableRefObject<{ [key: string]: ReactDOM.Root }> = useRef(
    {}
  );

  const loadComponent = useCallback(
    (componentId: string, component: any) => {
      if (componentId in components) {
        return;
      }

      addComponent(componentId, component);
      compiler?.postMessage({
        action: 'execute',
        componentId,
      });
    },
    [compiler, components, addComponent]
  );

  const mountElement = useCallback(
    ({
      componentId,
      element,
      id,
    }: {
      componentId: string;
      element: ComponentDOMElement;
      id?: string;
    }) => {
      const domId = id || getAppDomId(componentId);

      if (!domRoots.current[domId]) {
        const domElement = document.getElementById(domId);
        if (!domElement) {
          console.error(`Node not found: #${domId}`);
          return;
        }

        domRoots.current[domId] = ReactDOM.createRoot(domElement);
      }

      domRoots.current[domId].render(
        React.createElement(React.Fragment, null, element.props.children)
      );
    },
    [domRoots]
  );

  const processMessage = useCallback(
    (event: MessageEvent<ContainerPayload>) => {
      try {
        if (
          typeof event.data !== 'object' ||
          !event.data?.type?.startsWith('component.')
        ) {
          return;
        }

        const { data } = event;
        hooks?.messageReceived?.({
          fromComponent: data.containerId,
          message: data,
        });

        const sourceIframe = document.getElementById(
          `iframe-${data.containerId}`
        ) as HTMLIFrameElement;

        if (sourceIframe?.contentWindow !== event.source) {
          // this message came from a different iframe than the one specified in the message payload
          return;
        }

        const onMessageSent = ({ toComponent, message }: BWEMessage) =>
          hooks?.messageReceived?.({ toComponent, message });

        switch (data.type) {
          case 'component.callbackInvocation': {
            // invocations with null container targets are invoking methods exposed by the outer application
            if (data.targetId === null) {
              return onApplicationMethodInvocation({
                args: data.args,
                componentId: data.containerId,
                method: data.method,
                onMessageSent,
                requestId: data.requestId,
                social,
                wallet,
              });
            }

            onCallbackInvocation({ data, onMessageSent });
            break;
          }
          case 'component.callbackResponse': {
            onCallbackResponse({ data, onMessageSent });
            break;
          }
          case 'component.render': {
            const { childComponents, containerId, node } = data;

            onRender({
              childComponents,
              containerId,
              debug,
              getContainerRenderCount: getComponentRenderCount,
              isComponentLoaded: (c: string) => !!components[c],
              loadComponent: (component) =>
                loadComponent(component.componentId, component),
              mountElement: ({ componentId, element }) => {
                hooks?.componentRendered?.(componentId);
                mountElement({ componentId, element, id: data.node.props?.id });
              },
              node,
              onMessageSent,
            });
            break;
          }
          default:
            break;
        }
      } catch (e) {
        console.error({ event }, e);
      }
    },
    [
      components,
      loadComponent,
      mountElement,
      hooks,
      debug,
      getComponentRenderCount,
      social,
      wallet,
    ]
  );

  useEffect(() => {
    window.addEventListener('message', processMessage);
    return () => window.removeEventListener('message', processMessage);
  }, [processMessage]);

  return {
    domRoots,
  };
}

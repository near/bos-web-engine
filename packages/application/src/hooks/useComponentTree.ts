import type { MessagePayload } from '@bos-web-engine/common';
import type { ComponentCompilerRequest } from '@bos-web-engine/compiler';
import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { getAppDomId } from '../container';
import {
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
  componentRendered: (componentId: string) => void;
  components: { [p: string]: any };
  debug?: WebEngineDebug;
  getComponentRenderCount: (componentId: string) => number;
  hooks?: WebEngineHooks;
}

export function useComponentTree({
  compiler,
  debug,
  hooks,
  components,
  addComponent,
  componentRendered,
  getComponentRenderCount,
}: UseComponentTreeParams) {
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

  const renderComponent = useCallback(
    (componentId: string) => componentRendered(componentId),
    []
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

      domRoots.current[domId].render(element);
    },
    [domRoots]
  );

  const processMessage = useCallback(
    (event: MessageEvent<MessagePayload>) => {
      try {
        if (typeof event.data !== 'object') {
          return;
        }

        const { data } = event;
        if (data.type) {
          // @ts-expect-error
          const fromComponent = data.componentId || data.originator;
          hooks?.messageReceived?.({ fromComponent, message: data });
        }

        const onMessageSent = ({ toComponent, message }: BWEMessage) =>
          hooks?.messageReceived?.({ toComponent, message });

        switch (data.type) {
          case 'component.callbackInvocation': {
            onCallbackInvocation({ data, onMessageSent });
            break;
          }
          case 'component.callbackResponse': {
            onCallbackResponse({ data, onMessageSent });
            break;
          }
          case 'component.render': {
            onRender({
              data,
              debug,
              mountElement: ({ componentId, element }) => {
                renderComponent(componentId);
                mountElement({ componentId, element, id: data.node.props?.id });
              },
              loadComponent: (component) =>
                loadComponent(component.componentId, component),
              isComponentLoaded: (c: string) => !!components[c],
              onMessageSent,
              getContainerRenderCount: getComponentRenderCount,
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
      renderComponent,
      hooks,
      debug,
      getComponentRenderCount,
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

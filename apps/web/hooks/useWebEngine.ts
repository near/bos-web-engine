import {
  onCallbackInvocation,
  onCallbackResponse,
  onRender,
  WidgetActivityMonitor,
  WidgetDOMElement,
  WidgetUpdate,
} from '@bos-web-engine/application';
import type { ComponentCompilerResponse } from '@bos-web-engine/compiler';
import { getAppDomId } from '@bos-web-engine/iframe';
import { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

interface UseWebEngineParams {
  monitor: WidgetActivityMonitor;
  rootComponentPath: string;
  showWidgetDebug: boolean;
}

export function useWebEngine({ monitor, showWidgetDebug, rootComponentPath }: UseWebEngineParams) {
  const [compiler, setCompiler] = useState<any>(null);
  const [components, setComponents] = useState<{ [key: string]: any }>({});
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(null);

  const domRoots: { [key: string]: ReactDOM.Root } = {};

  const addComponent = useCallback((componentId: string, component: any) => {
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: { ...currentComponents[componentId], ...component },
    }));
  }, []);

  const loadComponent = useCallback((componentId: string, component: any) => {
    if (componentId in components) {
      return;
    }

    addComponent(componentId, component);
    compiler?.postMessage({ componentId, isTrusted: component.isTrusted });
  }, [compiler, components]);

  const mountElement = ({ widgetId, element }: { widgetId: string, element: WidgetDOMElement }) => {
    if (!domRoots[widgetId]) {
      const domElement = document.getElementById(getAppDomId(widgetId));
      if (!domElement) {
        const metricKey = widgetId.split('##')[0];
        monitor.missingWidgetReferenced(metricKey);
        console.error(`Node not found: #${getAppDomId(widgetId)}`);
        return;
      }

      domRoots[widgetId] = ReactDOM.createRoot(domElement);
    }

    domRoots[widgetId].render(element);
  };

  useEffect(() => {
    function processMessage(event: any) {
      try {
        if (typeof event.data !== 'object') {
          return;
        }

        const { data } = event;
        switch (data.type) {
          case 'widget.callbackInvocation': {
            monitor.widgetCallbackInvoked(data);
            onCallbackInvocation({ data });
            break;
          }
          case 'widget.callbackResponse': {
            monitor.widgetCallbackReturned(data);
            onCallbackResponse({ data });
            break;
          }
          case 'widget.render': {
            monitor.widgetRendered(data);
            onRender({
              data,
              isDebug: showWidgetDebug,
              markWidgetUpdated: (update: WidgetUpdate) => monitor.widgetUpdated(update),
              mountElement,
              loadComponent: (component) => loadComponent(component.componentId, component),
              isComponentLoaded: (c: string) => !!components[c],
            });
            break;
          }
          default:
            break;
        }
      } catch (e) {
        console.error({ event }, e);
      }
    }

    window.addEventListener('message', processMessage);
    return () => window.removeEventListener('message', processMessage);
  }, [rootComponentSource, showWidgetDebug]);

  useEffect(() => {
    if (!rootComponentPath) {
      return;
    }

    if (!compiler) {
      const worker = new Worker(new URL('../workers/compiler.ts', import.meta.url));
      setCompiler(worker);
    } else {
      compiler.onmessage = ({ data }: MessageEvent<ComponentCompilerResponse>) => {
        const { componentId, componentSource } = data;
        const component = { ...components[componentId], componentId, componentSource };
        if (!rootComponentSource && componentId === rootComponentPath) {
          setRootComponentSource(componentId);
        }
        monitor.widgetAdded({ source: componentId, ...component });
        addComponent(componentId, component);
      };

      compiler.postMessage({
        componentId: rootComponentPath,
        isTrusted: false,
      });
    }
  }, [rootComponentPath, rootComponentSource, compiler]);

  return {
    components,
  };
}

import {
  onCallbackInvocation,
  onCallbackResponse,
  onRender,
  WidgetDOMElement,
  WidgetUpdate,
} from '@bos-web-engine/application';
import type { ComponentCompilerResponse } from '@bos-web-engine/compiler';
import { getAppDomId } from '@bos-web-engine/iframe';
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { useComponentMetrics } from './useComponentMetrics';

interface UseWebEngineParams {
  rootComponentPath: string;
  showWidgetDebug: boolean;
}

export function useWebEngine({ showWidgetDebug, rootComponentPath }: UseWebEngineParams) {
  const [compiler, setCompiler] = useState<any>(null);
  const [components, setComponents] = useState<{ [key: string]: any }>({});
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(null);
  const {
    metrics,
    callbackInvoked,
    callbackReturned,
    componentMissing,
    componentRendered,
    componentUpdated,
  } = useComponentMetrics();

  const domRoots: MutableRefObject<{ [key: string]: ReactDOM.Root }> = useRef({});

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
  }, [compiler, components, addComponent]);

  const mountElement = useCallback(({ widgetId, element }: { widgetId: string, element: WidgetDOMElement }) => {
    if (!domRoots.current[widgetId]) {
      const domElement = document.getElementById(getAppDomId(widgetId));
      if (!domElement) {
        const metricKey = widgetId.split('##')[0];
        componentMissing(metricKey);
        console.error(`Node not found: #${getAppDomId(widgetId)}`);
        return;
      }

      domRoots.current[widgetId] = ReactDOM.createRoot(domElement);
    }

    domRoots.current[widgetId].render(element);
  }, [domRoots]);

  const processMessage = useCallback((event: any) => {
    try {
      if (typeof event.data !== 'object') {
        return;
      }

      const { data } = event;
      switch (data.type) {
        case 'widget.callbackInvocation': {
          callbackInvoked(data);
          onCallbackInvocation({ data });
          break;
        }
        case 'widget.callbackResponse': {
          callbackReturned(data);
          onCallbackResponse({ data });
          break;
        }
        case 'widget.render': {
          componentRendered(data);
          onRender({
            data,
            isDebug: showWidgetDebug,
            markWidgetUpdated: (update: WidgetUpdate) => componentUpdated(update),
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
  }, [showWidgetDebug, components, loadComponent, mountElement]);

  useEffect(() => {
    window.addEventListener('message', processMessage);
    return () => window.removeEventListener('message', processMessage);
  }, [processMessage]);

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
    metrics: {
      ...metrics,
      componentsLoaded: Object.keys(components),
    },
  };
}

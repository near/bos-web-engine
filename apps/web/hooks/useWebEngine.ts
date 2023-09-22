import {
  ComponentDOMElement,
  onCallbackInvocation,
  onCallbackResponse,
  BWEMessage,
  onRender,
} from '@bos-web-engine/application';
import type { ComponentCompilerResponse } from '@bos-web-engine/compiler';
import type { MessagePayload } from '@bos-web-engine/container';
import { getAppDomId } from '@bos-web-engine/iframe';
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { useComponentMetrics } from './useComponentMetrics';

interface UseWebEngineParams {
  rootComponentPath: string;
  showComponentDebug: boolean;
}

export function useWebEngine({ showComponentDebug, rootComponentPath }: UseWebEngineParams) {
  const [compiler, setCompiler] = useState<any>(null);
  const [isCompilerInitialized, setIsCompilerInitialized] = useState(false);
  const [components, setComponents] = useState<{ [key: string]: any }>({});
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidRootComponentPath, setIsValidRootComponentPath] = useState(false);

  const {
    metrics,
    recordMessage,
    componentMissing,
  } = useComponentMetrics();

  const domRoots: MutableRefObject<{ [key: string]: ReactDOM.Root }> = useRef({});

  const addComponent = useCallback((componentId: string, component: any) => {
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: { ...currentComponents[componentId], ...component, renderCount: 1 },
    }));
  }, []);

  const loadComponent = useCallback((componentId: string, component: any) => {
    if (componentId in components) {
      return;
    }

    addComponent(componentId, component);
    compiler?.postMessage({ componentId, isTrusted: component.isTrusted });
  }, [compiler, components, addComponent]);

  const renderComponent = useCallback((componentId: string) => {
    setComponents((currentComponents) => {
      return ({
        ...currentComponents,
        [componentId]: {
          ...currentComponents[componentId],
          renderCount: (currentComponents?.[componentId]?.renderCount + 1) || 0,
        },
      });
    });
  }, []);

  const getComponentRenderCount = useCallback((componentId: string) => {
    return components?.[componentId]?.renderCount;
  }, [components]);

  const mountElement = useCallback(({ componentId, element }: { componentId: string, element: ComponentDOMElement }) => {
    if (!domRoots.current[componentId]) {
      const domElement = document.getElementById(getAppDomId(componentId));
      if (!domElement) {
        const metricKey = componentId.split('##')[0];
        componentMissing(metricKey);
        console.error(`Node not found: #${getAppDomId(componentId)}`);
        return;
      }

      domRoots.current[componentId] = ReactDOM.createRoot(domElement);
    }

    domRoots.current[componentId].render(element);
  }, [domRoots, componentMissing]);

  const processMessage = useCallback((event: MessageEvent<MessagePayload>) => {
    try {
      if (typeof event.data !== 'object') {
        return;
      }

      const { data } = event;
      if (data.type) {
        // @ts-expect-error FIXME
        const fromComponent = data.componentId || data.originator;
        recordMessage({ fromComponent, message: data });
      }

      const onMessageSent = ({ toComponent, message }: BWEMessage) => recordMessage({ toComponent, message });

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
            getComponentRenderCount,
            isDebug: showComponentDebug,
            mountElement: ({ componentId, element }) => {
              renderComponent(componentId);
              mountElement({ componentId, element });
            },
            loadComponent: (component) => loadComponent(component.componentId, component),
            isComponentLoaded: (c: string) => !!components[c],
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
  }, [showComponentDebug, components, loadComponent, mountElement, getComponentRenderCount, renderComponent, recordMessage]);

  useEffect(() => {
    window.addEventListener('message', processMessage);
    return () => window.removeEventListener('message', processMessage);
  }, [processMessage]);

  useEffect(() => {
    setIsValidRootComponentPath((/^[\w.]+\.near\/widget\/[\w.]+$/ig).test(rootComponentPath));
  }, [rootComponentPath]);

  useEffect(() => {
    if (!rootComponentPath || !isValidRootComponentPath) {
      return;
    }

    if (!compiler) {
      const worker = new Worker(new URL('../workers/compiler.ts', import.meta.url));
      setCompiler(worker);
    } else if (!isCompilerInitialized) {
      setIsCompilerInitialized(true);

      compiler.onmessage = ({ data }: MessageEvent<ComponentCompilerResponse>) => {
        const { componentId, componentSource, error: loadError } = data;
        if (loadError) {
          setError(loadError.message);
          return;
        }

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
  }, [rootComponentPath, rootComponentSource, compiler, addComponent, components, isCompilerInitialized, error, isValidRootComponentPath]);

  return {
    components,
    error: isValidRootComponentPath ? error : `Invalid Component path ${rootComponentPath}`,
    metrics: {
      ...metrics,
      componentsLoaded: Object.keys(components),
    },
  };
}

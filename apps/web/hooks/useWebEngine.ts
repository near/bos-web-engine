import {
  BWEMessage,
  ComponentDOMElement,
  onCallbackInvocation,
  onCallbackResponse,
  onRender,
} from '@bos-web-engine/application';
import type {
  ComponentCompilerRequest,
  ComponentCompilerResponse,
} from '@bos-web-engine/compiler';
import type { MessagePayload } from '@bos-web-engine/container';
import { getAppDomId } from '@bos-web-engine/iframe';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom/client';

import { useComponentMetrics } from './useComponentMetrics';
import { useFlags } from './useFlags';
import { useComponentSourcesStore } from '../stores/component-sources';

interface WebEngineConfiguration {
  preactVersion: string;
}

interface UseWebEngineParams {
  config?: WebEngineConfiguration;
  rootComponentPath?: string;
}

interface CompilerWorker extends Omit<Worker, 'postMessage'> {
  postMessage(comilerRequest: ComponentCompilerRequest): void;
}

const DEFAULT_CONFIG = {
  preactVersion: '10.17.1',
};

export function useWebEngine({
  config = DEFAULT_CONFIG,
  rootComponentPath,
}: UseWebEngineParams) {
  const [compiler, setCompiler] = useState<CompilerWorker | null>(null);
  const [isCompilerInitialized, setIsCompilerInitialized] = useState(false);
  const [components, setComponents] = useState<{ [key: string]: any }>({});
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isValidRootComponentPath, setIsValidRootComponentPath] =
    useState(false);

  const [flags] = useFlags();

  const { metrics, recordMessage } = useComponentMetrics();

  const domRoots: MutableRefObject<{ [key: string]: ReactDOM.Root }> = useRef(
    {}
  );

  const addComponent = useCallback((componentId: string, component: any) => {
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: {
        ...currentComponents[componentId],
        ...component,
        renderCount: 1,
      },
    }));
  }, []);

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

  const renderComponent = useCallback((componentId: string) => {
    setComponents((currentComponents) => {
      return {
        ...currentComponents,
        [componentId]: {
          ...currentComponents[componentId],
          renderCount: currentComponents?.[componentId]?.renderCount + 1 || 0,
        },
      };
    });
  }, []);

  const getComponentRenderCount = useCallback(
    (componentId: string) => {
      return components?.[componentId]?.renderCount;
    },
    [components]
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
          // @ts-expect-error FIXME
          const fromComponent = data.componentId || data.originator;
          recordMessage({ fromComponent, message: data });
        }

        const onMessageSent = ({ toComponent, message }: BWEMessage) =>
          recordMessage({ toComponent, message });

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
              mountElement: ({ componentId, element }) => {
                renderComponent(componentId);
                mountElement({ componentId, element, id: data.node.props?.id });
              },
              loadComponent: (component) =>
                loadComponent(component.componentId, component),
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
    },
    [components, loadComponent, mountElement, renderComponent, recordMessage]
  );

  useEffect(() => {
    window.addEventListener('message', processMessage);
    return () => window.removeEventListener('message', processMessage);
  }, [processMessage]);

  useEffect(() => {
    setIsValidRootComponentPath(
      !!rootComponentPath &&
        /^((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+$/gi.test(
          rootComponentPath
        )
    );
  }, [rootComponentPath]);

  const addSource = useComponentSourcesStore((store) => store.addSource);

  useEffect(() => {
    if (!rootComponentPath || !isValidRootComponentPath) {
      return;
    }

    if (!compiler) {
      const worker = new Worker(
        new URL('../workers/compiler.ts', import.meta.url)
      );
      const initPayload: ComponentCompilerRequest = {
        action: 'init',
        localFetchUrl: flags?.bosLoaderUrl,
        preactVersion: config?.preactVersion,
      };
      worker.postMessage(initPayload);
      setCompiler(worker);
    } else if (!isCompilerInitialized) {
      setIsCompilerInitialized(true);

      compiler.onmessage = ({
        data,
      }: MessageEvent<ComponentCompilerResponse>) => {
        const {
          componentId,
          componentSource,
          rawSource,
          componentPath,
          error: loadError,
          importedModules,
        } = data;

        if (loadError) {
          setError(loadError.message);
          return;
        }

        addSource(componentPath, rawSource);

        // set the Preact import maps
        // TODO find a better place for this
        importedModules.set(
          'preact',
          `https://esm.sh/preact@${config.preactVersion}`
        );
        importedModules.set(
          'preact/',
          `https://esm.sh/preact@${config.preactVersion}/`
        );

        const component = {
          ...components[componentId],
          componentId,
          componentSource,
          moduleImports: importedModules,
        };

        if (!rootComponentSource && componentId === rootComponentPath) {
          setRootComponentSource(componentId);
        }

        addComponent(componentId, component);
      };

      compiler.postMessage({
        action: 'execute',
        componentId: rootComponentPath,
      });
    }
  }, [
    rootComponentPath,
    rootComponentSource,
    compiler,
    addComponent,
    components,
    isCompilerInitialized,
    error,
    isValidRootComponentPath,
    flags?.bosLoaderUrl,
    addSource,
    config?.preactVersion,
  ]);

  return {
    components,
    error: isValidRootComponentPath
      ? error
      : `Invalid Component path ${rootComponentPath}`,
    metrics: {
      ...metrics,
      componentsLoaded: Object.keys(components),
    },
  };
}

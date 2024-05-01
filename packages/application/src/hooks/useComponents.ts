import type { ComponentCompilerResponse } from '@bos-web-engine/compiler';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { UseComponentsParams } from '../types';

/**
 * Provides an interface for managing containers
 * @param appendStylesheet callback to add container stylesheets to the Component tree CSS
 * @param compiler Web Engine compiler instance
 * @param config parameters to be applied to the entire Component tree
 * @param rootComponentPath Component path for the root Component
 */
export function useComponents({
  appendStylesheet,
  compiler,
  config,
  rootComponentPath,
  queryParams,
}: UseComponentsParams) {
  const [components, setComponents] = useState<{ [key: string]: any }>({});
  const [isValidRootComponentPath, setIsValidRootComponentPath] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(
    null
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

  const getComponentRenderCount = useCallback(
    (componentId: string) => {
      return components?.[componentId]?.renderCount;
    },
    [components]
  );

  useEffect(() => {
    setIsValidRootComponentPath(
      !!rootComponentPath &&
        /^((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+$/gi.test(
          rootComponentPath
        )
    );
  }, [rootComponentPath]);

  const hooks = useMemo(() => {
    const result = { ...config?.hooks } || {};

    result.componentRendered = (componentId: string) => {
      config?.hooks?.componentRendered?.(componentId);
      setComponents((currentComponents) => ({
        ...currentComponents,
        [componentId]: {
          ...currentComponents[componentId],
          renderCount: currentComponents?.[componentId]?.renderCount + 1 || 0,
        },
      }));
    };

    return result;
  }, [config?.hooks]);

  useEffect(() => {
    if (!rootComponentPath || !isValidRootComponentPath || !compiler) {
      return;
    }

    compiler.onmessage = ({
      data,
    }: MessageEvent<ComponentCompilerResponse>) => {
      const {
        componentId,
        componentSource,
        containerStyles,
        error: loadError,
        importedModules,
        queryParams,
      } = data;

      if (loadError) {
        setError(loadError.message);
        return;
      }

      if (containerStyles) {
        appendStylesheet(containerStyles);
      }

      hooks?.containerSourceCompiled?.(data);

      const component = {
        ...components[componentId],
        componentId,
        componentSource,
        moduleImports: importedModules,
        queryParams,
      };

      if (!rootComponentSource && componentId === rootComponentPath) {
        setRootComponentSource(componentId);
      }

      addComponent(componentId, component);
    };

    compiler.postMessage({
      action: 'execute',
      componentId: rootComponentPath,
      queryParams,
    });
  }, [
    addComponent,
    appendStylesheet,
    components,
    hooks,
    compiler,
    rootComponentPath,
    rootComponentSource,
    error,
    isValidRootComponentPath,
    config?.flags?.bosLoaderUrl,
    queryParams,
  ]);

  return {
    addComponent,
    components,
    error,
    hooks,
    getComponentRenderCount,
    setComponents,
  };
}

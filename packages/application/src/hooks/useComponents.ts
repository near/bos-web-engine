import type { ComponentCompilerResponse } from '@bos-web-engine/compiler';
import { useCallback, useEffect, useState } from 'react';

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

  const hooks = { ...config.hooks } || {};
  const { flags, preactVersion } = config;

  useEffect(() => {
    setIsValidRootComponentPath(
      !!rootComponentPath &&
        /^((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+$/gi.test(
          rootComponentPath
        )
    );
  }, [rootComponentPath]);

  hooks.componentRendered = (componentId: string) => {
    config.hooks?.componentRendered?.(componentId);
    setComponents((currentComponents) => ({
      ...currentComponents,
      [componentId]: {
        ...currentComponents[componentId],
        renderCount: currentComponents?.[componentId]?.renderCount + 1 || 0,
      },
    }));
  };

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
      } = data;

      if (loadError) {
        setError(loadError.message);
        return;
      }

      if (containerStyles) {
        appendStylesheet(containerStyles);
      }

      hooks?.containerSourceCompiled?.(data);

      // set the Preact import maps
      // TODO find a better place for this
      const preactImportBasePath =
        'https://esm.sh/stable/preact@10.19.3/X-YS9yZWFjdDpwcmVhY3QvY29tcGF0/es2022/index.js';
      importedModules.set('preact', preactImportBasePath);
      importedModules.set('preact/', `${preactImportBasePath}/`);
      importedModules.set(
        'react',
        'https://esm.sh/stable/preact@10.19.3/X-YS9yZWFjdDpwcmVhY3QvY29tcGF0/es2022/compat.js'
      );
      importedModules.set(
        'react-dom',
        'https://esm.sh/stable/preact@10.19.3/X-YS9yZWFjdDpwcmVhY3QvY29tcGF0/es2022/compat.js'
      );

      for (const moduleName of importedModules.keys()) {
        const [lib, subpath] = moduleName.split('/');
        if (subpath && ['preact', 'react-dom'].includes(lib)) {
          importedModules.delete(moduleName);
        }
      }

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
  }, [
    compiler,
    rootComponentPath,
    rootComponentSource,
    error,
    isValidRootComponentPath,
    flags?.bosLoaderUrl,
    preactVersion,
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

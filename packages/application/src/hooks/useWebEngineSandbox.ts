import { useEffect, useState } from 'react';

import { useCompiler } from './useCompiler';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import { useCss } from './useCss';
import type { UseWebEngineSandboxParams } from '../types';

export function useWebEngineSandbox({
  localComponents,
  config,
  rootComponentPath,
  queryParams,
}: UseWebEngineSandboxParams) {
  const [nonce, setNonce] = useState('');

  const { appendStylesheet, resetContainerStylesheet } = useCss();
  const compiler = useCompiler({ config, localComponents });
  const {
    addComponent,
    components,
    error,
    getComponentRenderCount,
    hooks,
    setComponents,
  } = useComponents({
    appendStylesheet,
    compiler,
    config,
    rootComponentPath,
    queryParams,
  });

  const { domRoots } = useComponentTree({
    addComponent,
    compiler,
    components,
    getComponentRenderCount,
    hooks,
  });

  useEffect(() => {
    if (!localComponents || !rootComponentPath) return;

    domRoots.current = {};
    setComponents({});
    resetContainerStylesheet();
    setNonce(`${rootComponentPath}:${Date.now().toString()}`);

    compiler?.postMessage({
      action: 'execute',
      componentId: rootComponentPath,
    });
  }, [compiler, domRoots, localComponents, rootComponentPath, setComponents]);

  return {
    components,
    error,
    nonce,
  };
}

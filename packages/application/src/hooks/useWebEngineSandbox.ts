import { useEffect, useState } from 'react';

import { useCompiler } from './useCompiler';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import type { UseWebEngineSandboxParams } from '../types';

export function useWebEngineSandbox({
  localComponents,
  config,
  rootComponentPath,
}: UseWebEngineSandboxParams) {
  const [nonce, setNonce] = useState('');
  const preactVersion = config.preactVersion;

  const compiler = useCompiler({ config, localComponents });
  const {
    addComponent,
    components,
    error,
    getComponentRenderCount,
    hooks,
    resetContainerStylesheet,
    setComponents,
  } = useComponents({
    compiler,
    config,
    rootComponentPath,
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
      action: 'init',
      localComponents,
      preactVersion,
    });

    compiler?.postMessage({
      action: 'execute',
      componentId: rootComponentPath,
    });
  }, [
    compiler,
    domRoots,
    localComponents,
    preactVersion,
    rootComponentPath,
    setComponents,
  ]);

  return {
    components,
    error,
    nonce,
  };
}

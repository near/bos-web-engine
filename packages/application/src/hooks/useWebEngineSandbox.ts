import { useEffect, useState } from 'react';

import { useCompilerWorker } from './useCompilerWorker';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import type { UseWebEngineSandboxParams } from '../types';

export function useWebEngineSandbox({
  localComponents,
  config,
  rootComponentPath,
}: UseWebEngineSandboxParams) {
  const [nonce, setNonce] = useState('');
  const { addComponent, components, componentRendered, setComponents } =
    useComponents();
  const { compiler, error } = useCompilerWorker({
    addComponent,
    components,
    config,
    rootComponentPath,
  });

  const { domRoots } = useComponentTree({
    addComponent,
    compiler,
    componentRendered,
    components,
    hooks: config.hooks,
  });

  useEffect(() => {
    if (!localComponents || !rootComponentPath) return;

    domRoots.current = {};
    setComponents({});
    setNonce(`${rootComponentPath}:${Date.now().toString()}`);

    compiler?.postMessage({
      action: 'set-local-components',
      components: localComponents,
      rootComponentPath,
    });
  }, [compiler, localComponents, rootComponentPath]);

  return {
    components,
    error,
    nonce,
  };
}

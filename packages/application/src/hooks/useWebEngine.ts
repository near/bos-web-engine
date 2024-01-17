import { useCompilerWorker } from './useCompilerWorker';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import type { UseWebEngineParams } from '../types';

export function useWebEngine({
  config,
  rootComponentPath,
}: UseWebEngineParams) {
  const {
    addComponent,
    components,
    componentRendered,
    getComponentRenderCount,
  } = useComponents();
  const { compiler, error } = useCompilerWorker({
    addComponent,
    components,
    config,
    rootComponentPath,
  });

  useComponentTree({
    addComponent,
    compiler,
    componentRendered,
    components,
    debug: config.debug,
    getComponentRenderCount,
    hooks: config.hooks,
  });

  return {
    components,
    error,
  };
}

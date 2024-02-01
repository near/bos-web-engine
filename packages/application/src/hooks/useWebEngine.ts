import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import type { UseWebEngineParams } from '../types';

export function useWebEngine({
  config,
  rootComponentPath,
}: UseWebEngineParams) {
  const { addComponent, compiler, components, error, getComponentRenderCount, hooks } = useComponents({
    config,
    rootComponentPath,
  });

  useComponentTree({
    addComponent,
    compiler,
    components,
    debug: config.debug,
    getComponentRenderCount,
    hooks,
  });

  return {
    components,
    error,
  };
}

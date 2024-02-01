import { useCompiler } from './useCompiler';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import type { UseWebEngineParams } from '../types';

export function useWebEngine({
  config,
  rootComponentPath,
}: UseWebEngineParams) {
  const compiler = useCompiler({ config });
  const { addComponent, components, error, getComponentRenderCount, hooks } =
    useComponents({
      compiler,
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

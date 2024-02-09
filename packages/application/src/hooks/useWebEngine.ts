import { useCompiler } from './useCompiler';
import { useComponents } from './useComponents';
import { useComponentTree } from './useComponentTree';
import { useCss } from './useCss';
import type { UseWebEngineParams } from '../types';

export function useWebEngine({
  config,
  rootComponentPath,
}: UseWebEngineParams) {
  const { appendStylesheet } = useCss();
  const compiler = useCompiler({ config });
  const { addComponent, components, error, getComponentRenderCount, hooks } =
    useComponents({
      appendStylesheet,
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

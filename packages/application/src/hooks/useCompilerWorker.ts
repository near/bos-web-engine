import type {
  ComponentCompilerRequest,
  ComponentCompilerResponse,
} from '@bos-web-engine/compiler';
import { useEffect, useState } from 'react';

import type { UseWebEngineParams } from '../types';

interface CompilerWorker extends Omit<Worker, 'postMessage'> {
  postMessage(compilerRequest: ComponentCompilerRequest): void;
}

interface UseCompilerWorker extends UseWebEngineParams {
  components: { [key: string]: any };
  addComponent: (componentId: string, component: any) => void;
}

export function useCompilerWorker({
  components,
  addComponent,
  config,
  rootComponentPath,
}: UseCompilerWorker) {
  const [compiler, setCompiler] = useState<CompilerWorker | null>(null);
  const [isCompilerInitialized, setIsCompilerInitialized] = useState(false);
  const [isValidRootComponentPath, setIsValidRootComponentPath] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootComponentSource, setRootComponentSource] = useState<string | null>(
    null
  );

  const { flags, hooks, preactVersion } = config;

  useEffect(() => {
    setIsValidRootComponentPath(
      !!rootComponentPath &&
        /^((([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+)\/[\w.-]+$/gi.test(
          rootComponentPath
        )
    );
  }, [rootComponentPath]);

  useEffect(() => {
    if (!rootComponentPath || !isValidRootComponentPath) {
      return;
    }

    if (!compiler) {
      const worker = new Worker(
        new URL('../workers/compiler.js', import.meta.url)
      );
      const initPayload: ComponentCompilerRequest = {
        action: 'init',
        localFetchUrl: flags?.bosLoaderUrl,
        preactVersion,
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
          error: loadError,
          importedModules,
        } = data;

        if (loadError) {
          setError(loadError.message);
          return;
        }

        hooks?.containerSourceCompiled?.(data);

        // set the Preact import maps
        // TODO find a better place for this
        importedModules.set('preact', `https://esm.sh/preact@${preactVersion}`);
        importedModules.set(
          'preact/',
          `https://esm.sh/preact@${preactVersion}/`
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
    preactVersion,
    hooks,
  ]);

  return {
    compiler,
    error,
  };
}

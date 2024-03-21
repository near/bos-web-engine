import { BOSModule } from '@bos-web-engine/common';
import { useEffect, useState } from 'react';

import type { CompilerWorker, WebEngineConfiguration } from '../types';

/**
 * Provides an interface for managing containers
 * @param config parameters to be applied to the entire Component tree
 * @param rootComponentPath Component path for the root Component
 */
export function useCompiler({
  config,
  localComponents,
}: {
  config: WebEngineConfiguration;
  localComponents?: { [path: string]: BOSModule };
}) {
  const [compiler, setCompiler] = useState<CompilerWorker | null>(null);

  useEffect(() => {
    if (!compiler) {
      setCompiler(
        new Worker(new URL('../workers/compiler.js', import.meta.url))
      );
    }
  }, [compiler]);

  useEffect(() => {
    if (!compiler) {
      return;
    }

    compiler.postMessage({
      action: 'init',
      localComponents,
      preactVersion: config.preactVersion,
    });
  }, [
    compiler,
    config.flags?.bosLoaderUrl,
    config.preactVersion,
    localComponents,
  ]);

  return compiler;
}

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
      const worker = new Worker(
        new URL('../workers/compiler.js', import.meta.url)
      );

      worker.postMessage({
        action: 'init',
        localComponents,
        localFetchUrl: config.flags?.bosLoaderUrl,
        preactVersion: config.preactVersion,
      });
      setCompiler(worker);
    }
  }, [config.flags?.bosLoaderUrl, config.preactVersion, localComponents]);

  return compiler;
}

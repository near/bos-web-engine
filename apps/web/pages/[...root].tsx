import { useRouter } from 'next/router';

import { ComponentTree } from '../components';
import { useWebEngine } from '../hooks';

export default function Root() {
  const router = useRouter();
  const { query } = router;

  const isDebug = query.isDebug === 'true';
  const showMonitor = query.showMonitor === 'true';
  const rootComponentPath = ((query.root || []) as string[]).join('/');

  const { components, error, metrics } = useWebEngine({
    rootComponentPath,
    debugConfig: {
      isDebug,
      showMonitor,
    },
  });

  return (
    <div className='App'>
      {error && (
        <div className='error'>
          {error}
        </div>
      )}
      {!error && rootComponentPath && (
        <ComponentTree
          components={components}
          isDebug={isDebug}
          metrics={metrics}
          rootComponentPath={rootComponentPath}
          showMonitor={showMonitor}
        />
      )}
    </div>
  );
}

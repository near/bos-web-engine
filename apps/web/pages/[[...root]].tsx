import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Inspector } from '../components';
import { useComponentMetrics, useFlags } from '../hooks';
import { useComponentSourcesStore } from '../stores/component-sources';

const DEFAULT_COMPONENT = process.env.NEXT_PUBLIC_DEFAULT_ROOT_COMPONENT;
const PREACT_VERSION = '10.17.1';

export default function Root() {
  const router = useRouter();
  const { query } = router;

  // TODO update parameter name/source
  const isDebug = query.isDebug === 'true';

  const rootComponentPath = Array.isArray(query.root)
    ? query.root.join('/')
    : undefined;

  const [flags] = useFlags();
  const { /* metrics, */ reportMessage } = useComponentMetrics();
  const addSource = useComponentSourcesStore((store) => store.addSource);

  const { components, error } = useWebEngine({
    config: {
      debug: {
        showContainerBoundaries: isDebug,
      },
      flags,
      preactVersion: PREACT_VERSION,
      hooks: {
        containerSourceCompiled: ({ componentPath, rawSource }) =>
          addSource(componentPath, rawSource),
        messageReceived: reportMessage,
      },
    },
    rootComponentPath,
  });

  useEffect(() => {
    if (router.isReady && !query.root && DEFAULT_COMPONENT) {
      // change URL in place to accurately reflect default param values
      router.push(`/${DEFAULT_COMPONENT}`, undefined, { shallow: true });
    }
  }, [router, router.isReady, query.root]);

  return (
    <div className={`App ${isDebug ? 'bwe-debug' : ''}`}>
      {rootComponentPath && (
        <>
          {error && <div className="error">{error}</div>}
          <ComponentTree
            components={components}
            rootComponentPath={rootComponentPath}
          />
          <Inspector />
        </>
      )}
    </div>
  );
}

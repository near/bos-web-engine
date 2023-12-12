import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { ComponentTree } from '../components';
import { Inspector } from '../components/Inspector';
import { useWebEngine } from '../hooks';

const DEFAULT_COMPONENT = process.env.NEXT_PUBLIC_DEFAULT_ROOT_COMPONENT;

export default function Root() {
  const router = useRouter();
  const { query } = router;

  const rootComponentPath = Array.isArray(query.root)
    ? query.root.join('/')
    : undefined;

  const { components, error, metrics } = useWebEngine({
    rootComponentPath,
  });

  useEffect(() => {
    if (router.isReady && !query.root && DEFAULT_COMPONENT) {
      // change URL in place to accurately reflect default param values
      router.push(`/${DEFAULT_COMPONENT}`, undefined, { shallow: true });
    }
  }, [router, router.isReady, query.root]);

  return (
    <div className="App">
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

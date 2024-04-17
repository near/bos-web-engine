import { ThemeProvider } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Inspector } from '@/components/Inspector';
import { SandboxWebEngine, WebEngine } from '@/components/WebEngineVariants';
import { useDevToolsStore } from '@/stores/dev-tools';

const DEFAULT_COMPONENT = process.env.NEXT_PUBLIC_DEFAULT_ROOT_COMPONENT;

export default function Root() {
  const { account } = useWallet();
  const router = useRouter();
  const { query } = router;

  const queryShowContainerBoundaries = query.showContainerBoundaries === 'true';

  const rootComponentPath = Array.isArray(query.root)
    ? query.root.join('/')
    : undefined;

  const flags = useDevToolsStore((state) => state.flags);
  const devToolsLoaded = useDevToolsStore((state) => state.devToolsLoaded);

  const showContainerBoundaries =
    queryShowContainerBoundaries || flags.showContainerBoundaries;

  useEffect(() => {
    if (router.isReady && !query.root && DEFAULT_COMPONENT) {
      // change URL in place to accurately reflect default param values
      router.push(`/${DEFAULT_COMPONENT}`, undefined, { shallow: true });
    }
  }, [router, router.isReady, query.root]);

  return (
    <>
      <ThemeProvider defaultTheme="light">
        <div
          className={`bwe-app ${showContainerBoundaries ? 'bwe-debug' : ''}`}
        >
          {rootComponentPath && devToolsLoaded && (
            <>
              {flags?.bosLoaderUrl ? (
                <SandboxWebEngine
                  account={account}
                  rootComponentPath={rootComponentPath}
                  showContainerBoundaries={showContainerBoundaries}
                  flags={flags}
                />
              ) : (
                <WebEngine
                  account={account}
                  rootComponentPath={rootComponentPath}
                  showContainerBoundaries={showContainerBoundaries}
                  flags={flags}
                />
              )}
            </>
          )}
        </div>
      </ThemeProvider>

      {rootComponentPath && <Inspector />}
    </>
  );
}

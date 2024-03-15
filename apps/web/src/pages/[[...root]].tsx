import {
  ComponentTree,
  WebEngineFlags,
  useWebEngine,
  useWebEngineSandbox,
} from '@bos-web-engine/application';
import { ThemeProvider } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { AccountState } from '@near-wallet-selector/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Inspector } from '@/components/Inspector';
import { useComponentMetrics } from '@/hooks/useComponentMetrics';
import { useComponentSourcesStore } from '@/stores/component-sources';
import { useFlagsStore } from '@/stores/flags';

const DEFAULT_COMPONENT = process.env.NEXT_PUBLIC_DEFAULT_ROOT_COMPONENT;
const PREACT_VERSION = '10.17.1';

export default function Root() {
  const { account } = useWallet();
  const router = useRouter();
  const { query } = router;

  const queryShowContainerBoundaries = query.showContainerBoundaries === 'true';

  const rootComponentPath = Array.isArray(query.root)
    ? query.root.join('/')
    : undefined;

  const flags = useFlagsStore((state) => state.flags);

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
          {rootComponentPath && (
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

interface WebEnginePropsVariantProps {
  account: AccountState | null;
  rootComponentPath: string;
  showContainerBoundaries?: boolean;
  flags?: WebEngineFlags;
}

function WebEngine({
  account,
  rootComponentPath,
  flags,
}: WebEnginePropsVariantProps) {
  const { /* metrics, */ reportMessage } = useComponentMetrics();
  const addSource = useComponentSourcesStore((store) => store.addSource);

  const { components, error } = useWebEngine({
    config: {
      debug: {
        showContainerBoundaries: flags?.showContainerBoundaries,
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

  return (
    <>
      {error && <div className="error">{error}</div>}
      <ComponentTree
        components={components}
        currentUserAccountId={account?.accountId}
        rootComponentPath={rootComponentPath}
      />
    </>
  );
}
function SandboxWebEngine({
  account,
  rootComponentPath,
  flags,
}: WebEnginePropsVariantProps) {
  const { /* metrics, */ reportMessage } = useComponentMetrics();
  const addSource = useComponentSourcesStore((store) => store.addSource);

  const [localComponents, setLocalComponents] = useState();

  useEffect(() => {
    if (!flags?.bosLoaderUrl) return;

    fetchLocalComponents(flags?.bosLoaderUrl);
  }, [flags?.bosLoaderUrl]);

  async function fetchLocalComponents(url: string) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      // FIXME: change engine to expect `code`
      // transform data from having property called code to property called component
      Object.keys(data.components).forEach((key) => {
        data.components[key].component = data.components[key].code + '\n';
        delete data.components[key].code;
      });

      setLocalComponents(data.components);
    } catch (error) {
      console.error(error);
    }
  }

  const { components, error, nonce } = useWebEngineSandbox({
    config: {
      debug: {
        showContainerBoundaries: flags?.showContainerBoundaries,
      },
      flags,
      preactVersion: PREACT_VERSION,
      hooks: {
        containerSourceCompiled: ({ componentPath, rawSource }) =>
          addSource(componentPath, rawSource),
        messageReceived: reportMessage,
      },
    },
    localComponents,
    rootComponentPath,
  });

  return (
    <>
      {error && <div className="error">{error}</div>}
      <ComponentTree
        key={nonce}
        components={components}
        currentUserAccountId={account?.accountId}
        rootComponentPath={rootComponentPath}
      />
    </>
  );
}

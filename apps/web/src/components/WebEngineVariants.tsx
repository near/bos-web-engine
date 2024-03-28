import {
  ComponentTree,
  WebEngineFlags,
  useWebEngine,
  useWebEngineSandbox,
} from '@bos-web-engine/application';
import { AccountState } from '@near-wallet-selector/core';
import { useEffect, useState } from 'react';

import { useComponentSourcesStore } from '@/stores/component-sources';
import { useContainerMessagesStore } from '@/stores/container-messages';

interface WebEnginePropsVariantProps {
  account: AccountState | null;
  rootComponentPath: string;
  showContainerBoundaries?: boolean;
  flags?: WebEngineFlags;
}

export function WebEngine({
  account,
  rootComponentPath,
  flags,
}: WebEnginePropsVariantProps) {
  const addSource = useComponentSourcesStore((store) => store.addSource);
  const addMessage = useContainerMessagesStore((store) => store.addMessage);

  const { components, error } = useWebEngine({
    config: {
      debug: {
        showContainerBoundaries: flags?.showContainerBoundaries,
      },
      flags,
      hooks: {
        containerSourceCompiled: ({ componentPath, rawSource }) =>
          addSource(componentPath, rawSource),
        messageReceived: addMessage,
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

export function SandboxWebEngine({
  account,
  rootComponentPath,
  flags,
}: WebEnginePropsVariantProps) {
  const addSource = useComponentSourcesStore((store) => store.addSource);
  const addMessage = useContainerMessagesStore((store) => store.addMessage);

  const [localComponents, setLocalComponents] = useState();

  useEffect(() => {
    if (!flags?.bosLoaderUrl) return;

    fetchLocalComponents(flags?.bosLoaderUrl);
  }, [flags?.bosLoaderUrl]);

  async function fetchLocalComponents(url: string) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      // FIXME: change engine to expect `code` so we do not need to
      // transform data from having property called `code` to property called `component`
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
      hooks: {
        containerSourceCompiled: ({ componentPath, rawSource }) =>
          addSource(componentPath, rawSource),
        messageReceived: addMessage,
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

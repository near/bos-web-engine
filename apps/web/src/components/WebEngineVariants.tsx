import {
  ComponentTree,
  UseWebEngineSandboxParams,
  WebEngineFlags,
  useWebEngine,
  useWebEngineSandbox,
} from '@bos-web-engine/application';
import { useHotReload } from '@bos-web-engine/hot-reload-client';
import { AccountState } from '@near-wallet-selector/core';
import { useCallback, useEffect, useState } from 'react';

import { useQueryParams } from '@/hooks/useQueryParams';
import { useComponentSourcesStore } from '@/stores/component-sources';
import { useContainerMessagesStore } from '@/stores/container-messages';
import { LocalFetchStatus, useDevToolsStore } from '@/stores/dev-tools';

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
  const { queryParams } = useQueryParams();
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
    queryParams,
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
  const { hotReloadWebsocketUrl } = useDevToolsStore((state) => state.flags);
  const setLocalFetchStatus = useDevToolsStore(
    (state) => state.setLocalFetchStatus
  );
  const bosLoaderUrl = flags?.bosLoaderUrl;

  // null while loading
  // empty object on error
  const [localComponents, setLocalComponents] = useState<
    UseWebEngineSandboxParams['localComponents'] | null
  >(null);

  const fetchLocalComponents = useCallback(
    async (url: string) => {
      setLocalFetchStatus(LocalFetchStatus.LOADING);
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
        setLocalFetchStatus(LocalFetchStatus.SUCCESS);
      } catch (error) {
        console.error(`Failed to load local components from ${url}`, error);
        setLocalComponents({});
        setLocalFetchStatus(LocalFetchStatus.ERROR);
      }
    },
    [setLocalFetchStatus]
  );

  const refreshLocalComponents = useCallback(() => {
    if (!bosLoaderUrl) return;
    fetchLocalComponents(bosLoaderUrl);
  }, [bosLoaderUrl, fetchLocalComponents]);

  useEffect(() => {
    refreshLocalComponents();
  }, [bosLoaderUrl, refreshLocalComponents]);

  useHotReload(hotReloadWebsocketUrl, refreshLocalComponents);

  return localComponents ? (
    <PreparedLocalSandbox
      account={account}
      rootComponentPath={rootComponentPath}
      flags={flags}
      localComponents={localComponents}
    />
  ) : (
    <></>
  );
}

/**
 * Actual sandbox redering takes place here, but should only be loaded
 * once local components have been successfully resolved for the first
 * time at startup
 */
function PreparedLocalSandbox({
  account,
  rootComponentPath,
  flags,
  localComponents,
}: WebEnginePropsVariantProps & { localComponents: any }) {
  const { queryParams } = useQueryParams();
  const addSource = useComponentSourcesStore((store) => store.addSource);
  const addMessage = useContainerMessagesStore((store) => store.addMessage);

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
    queryParams,
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

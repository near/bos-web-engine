import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

export interface ContainerStoragePlugin {
  getItem: (key: string) => Promise<string>;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export default function initializeContainerStoragePlugin() {
  function initContainerStoragePlugin({
    callApplicationMethod,
  }: WebEngineContext): ContainerStoragePlugin {
    const getItem: ContainerStoragePlugin['getItem'] = (...args) =>
      callApplicationMethod({
        args,
        method: 'containerStorage.getItem',
      });

    const removeItem: ContainerStoragePlugin['removeItem'] = (...args) =>
      callApplicationMethod({
        args,
        method: 'containerStorage.removeItem',
      });

    const setItem: ContainerStoragePlugin['setItem'] = (...args) =>
      callApplicationMethod({
        args,
        method: 'containerStorage.setItem',
      });

    return {
      getItem,
      removeItem,
      setItem,
    };
  }

  return window.webEngine.initPlugin(initContainerStoragePlugin);
}

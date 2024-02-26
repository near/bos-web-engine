import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type { BrowserWalletBehaviour } from '@near-wallet-selector/core';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

type WalletSelectorPlugin = Pick<
  BrowserWalletBehaviour,
  'getAccounts' | 'signMessage' | 'signAndSendTransaction'
>;

export default function initializeWalletSelectorPlugin() {
  function initWalletSelectorPlugin({
    callApplicationMethod,
  }: WebEngineContext): WalletSelectorPlugin {
    const getAccounts: BrowserWalletBehaviour['getAccounts'] = () =>
      callApplicationMethod({
        args: [],
        method: 'walletSelector.getAccounts',
      });

    const signMessage: BrowserWalletBehaviour['signMessage'] = (args) =>
      callApplicationMethod({
        args: [args],
        method: 'walletSelector.signMessage',
      });

    const signAndSendTransaction: BrowserWalletBehaviour['signAndSendTransaction'] =
      (args) =>
        callApplicationMethod({
          args: [args],
          method: 'walletSelector.signAndSendTransaction',
        });

    return {
      getAccounts,
      signMessage,
      signAndSendTransaction,
    };
  }

  return window.webEngine.initPlugin(initWalletSelectorPlugin);
}

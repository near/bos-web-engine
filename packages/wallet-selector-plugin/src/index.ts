import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type { BrowserWalletBehaviour } from '@near-wallet-selector/core';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

/*
  The Required<...> wrapper is needed due to BrowserWalletBehaviour["signMessage"] being 
  optional. Our plugin ensures signMessage is always defined and callable - it just 
  throws an error if you aren't signed in
*/
export type WalletSelectorPlugin = Required<
  Pick<
    BrowserWalletBehaviour,
    'getAccounts' | 'signMessage' | 'signAndSendTransaction'
  >
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

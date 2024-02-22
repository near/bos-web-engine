import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type { Action } from '@near-js/transactions';
import type {
  BrowserWalletBehaviour,
  SignMessageParams,
  SignedMessage,
} from '@near-wallet-selector/core';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

type WalletSelectorPlugin = Pick<
  BrowserWalletBehaviour,
  'signMessage' | 'signAndSendTransaction'
>;

export default function initializeWalletSelectorPlugin() {
  function initWalletSelectorPlugin({
    callApplicationMethod,
  }: WebEngineContext): WalletSelectorPlugin {
    const signMessage = (args: SignMessageParams) =>
      callApplicationMethod<SignedMessage>({
        args: [args],
        method: 'walletSelector.signMessage',
      });

    const signAndSendTransaction = (args: {
      receiverId: string;
      actions: Action[];
    }) =>
      callApplicationMethod<SignedMessage>({
        args: [args],
        method: 'walletSelector.signAndSendTransaction',
      });

    return {
      signMessage,
      // @ts-expect-error FIXME incompatible @near-js versions?
      signAndSendTransaction,
    };
  }

  return window.webEngine.initPlugin<WalletSelectorPlugin>(
    initWalletSelectorPlugin
  );
}

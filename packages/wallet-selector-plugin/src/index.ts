import type { WebEngine, WebEngineContext } from '@bos-web-engine/common';
import type {
  SignMessageParams,
  SignedMessage,
} from '@near-wallet-selector/core';

declare global {
  interface Window {
    webEngine: WebEngine;
  }
}

interface WalletSelectorPlugin {
  signMessage(params: SignMessageParams): Promise<SignedMessage | void>;
}

export default function initializeWalletSelectorPlugin() {
  function initWalletSelectorPlugin({
    callApplicationMethod,
  }: WebEngineContext): WalletSelectorPlugin {
    const signMessage = (args: SignMessageParams) =>
      callApplicationMethod<SignedMessage>({
        args: [args],
        method: 'walletSelector.signMessage',
      });

    return {
      signMessage,
    };
  }

  return window.webEngine.initPlugin<WalletSelectorPlugin>(
    initWalletSelectorPlugin
  );
}

import { useWalletState } from '@bos-web-engine/wallet-selector-control';
import type {
  WalletSelector,
  WalletSelectorParams,
} from '@near-wallet-selector/core';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupSender } from '@near-wallet-selector/sender';
import { useEffect, useState } from 'react';

type UseWalletOptions = {
  contractId: string;
  network: WalletSelectorParams['network'];
  walletSelectorParams?: WalletSelectorParams;
};

let walletSelectorSetupPromise: Promise<WalletSelector> | null = null;

export function useWallet(
  { contractId, network, walletSelectorParams }: UseWalletOptions = {
    contractId: 'social.near',
    network: 'mainnet',
  }
) {
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );
  const [walletSelectorModal, setWalletSelectorModal] =
    useState<WalletSelectorModal | null>(null);
  const { account, wallet, walletSelectorState } =
    useWalletState(walletSelector);

  useEffect(() => {
    const initialize = async () => {
      if (!walletSelectorSetupPromise) {
        walletSelectorSetupPromise = setupWalletSelector(
          walletSelectorParams ?? {
            network,
            modules: [
              setupSender(),
              setupHereWallet(),
              setupMeteorWallet(),
              setupNightly(),
            ],
          }
        );
      }

      const selector = await walletSelectorSetupPromise;

      const modal = setupModal(selector, {
        contractId,
        theme: 'auto',
      });

      setWalletSelector(selector);
      setWalletSelectorModal(modal);
    };

    initialize();
  }, [contractId, network, walletSelectorParams]);

  return {
    account,
    wallet,
    walletSelector,
    walletSelectorModal,
    walletSelectorState,
  };
}

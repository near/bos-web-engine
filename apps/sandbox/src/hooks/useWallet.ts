import type {
  Wallet,
  WalletSelector,
  WalletSelectorParams,
  WalletSelectorState,
} from '@near-wallet-selector/core';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { SignMessageMethod } from '@near-wallet-selector/core/src/lib/wallet';
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
};

let walletSelectorSetupPromise: Promise<WalletSelector> | null = null;

export function useWallet(
  { contractId, network }: UseWalletOptions = {
    contractId: 'social.near',
    network: 'mainnet',
  }
) {
  const [wallet, setWallet] = useState<(Wallet & SignMessageMethod) | null>(
    null
  );
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );
  const [walletSelectorModal, setWalletSelectorModal] =
    useState<WalletSelectorModal | null>(null);
  const [walletSelectorState, setWalletSelectorState] =
    useState<WalletSelectorState | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!walletSelectorSetupPromise) {
        walletSelectorSetupPromise = setupWalletSelector({
          network,
          modules: [
            setupSender(),
            setupHereWallet(),
            setupMeteorWallet(),
            setupNightly(),
          ],
        });
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
  }, [contractId, network]);

  useEffect(() => {
    if (!walletSelector) return;

    const subscription = walletSelector.store.observable.subscribe(
      async (value) => {
        setWalletSelectorState(value);

        if (value.accounts.length > 0 && value.selectedWalletId) {
          const wallet = await walletSelector.wallet();
          setWallet(wallet);
        } else {
          setWallet(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [walletSelector]);

  return {
    account: walletSelectorState?.accounts[0],
    wallet,
    walletSelector,
    walletSelectorModal,
    walletSelectorState,
  };
}

import type { Wallet, WalletSelectorState } from '@near-wallet-selector/core';
import type { SignMessageMethod } from '@near-wallet-selector/core/src/lib/wallet';
import { useContext, useEffect, useState } from 'react';

import { WalletSelectorContext } from '../components/WalletSelectorProvider';

export const useWallet = () => {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      'useWallet() must be used inside the context provided by <WalletSelectorProvider>'
    );
  }

  let { walletSelector, walletSelectorModal } = context;
  const [wallet, setWallet] = useState<(Wallet & SignMessageMethod) | null>(
    null
  );
  const [walletSelectorState, setWalletSelectorState] =
    useState<WalletSelectorState | null>(null);
  const account = walletSelectorState?.accounts[0] ?? null;

  useEffect(() => {
    if (!walletSelector) return;

    setWalletSelectorState(walletSelector.store.getState());

    const subscription = walletSelector.store.observable.subscribe(
      async (value) => {
        setWalletSelectorState(value);

        if (
          value.accounts.length > 0 &&
          value.selectedWalletId &&
          walletSelector
        ) {
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
    account,
    wallet,
    walletSelector,
    walletSelectorModal,
    walletSelectorState,
  };
};

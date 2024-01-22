import type {
  Wallet,
  WalletSelector,
  WalletSelectorState,
} from '@near-wallet-selector/core';
import type { SignMessageMethod } from '@near-wallet-selector/core/src/lib/wallet';
import { useEffect, useState } from 'react';

export function useWalletState(walletSelector: WalletSelector | null) {
  const [wallet, setWallet] = useState<(Wallet & SignMessageMethod) | null>(
    null
  );
  const [walletSelectorState, setWalletSelectorState] =
    useState<WalletSelectorState | null>(null);

  useEffect(() => {
    if (!walletSelector) return;

    setWalletSelectorState(walletSelector.store.getState());

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
    walletSelectorState,
  };
}

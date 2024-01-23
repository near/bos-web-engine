import {
  setupWalletSelector,
  type WalletSelector,
  type WalletSelectorParams,
} from '@near-wallet-selector/core';
import {
  setupModal,
  type WalletSelectorModal,
} from '@near-wallet-selector/modal-ui';
import { createContext, ReactNode, useRef } from 'react';
import { useEffect, useState } from 'react';

type WalletSelectorContext = {
  walletSelector: WalletSelector | null;
  walletSelectorModal: WalletSelectorModal | null;
};

export const WalletSelectorContext = createContext<
  WalletSelectorContext | undefined
>(undefined);

type WalletSelectorProviderProps = {
  children: ReactNode;
  contractId: string;
  params: WalletSelectorParams;
};

export const WalletSelectorProvider = ({
  children,
  contractId,
  params,
}: WalletSelectorProviderProps) => {
  const walletSelectorSetupPromise = useRef<Promise<WalletSelector> | null>(
    null
  );
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );
  const [walletSelectorModal, setWalletSelectorModal] =
    useState<WalletSelectorModal | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!walletSelectorSetupPromise.current) {
        walletSelectorSetupPromise.current = setupWalletSelector(params);
      }

      const selector = await walletSelectorSetupPromise.current;

      const modal = setupModal(selector, {
        contractId,
        theme: 'auto',
      });

      setWalletSelector(selector);
      setWalletSelectorModal(modal);
    };

    initialize();
  }, [contractId, params]);

  return (
    <WalletSelectorContext.Provider
      value={{
        walletSelector,
        walletSelectorModal,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
};

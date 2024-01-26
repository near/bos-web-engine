import type { WalletSelector } from '@near-wallet-selector/core';
import { createContext, ReactNode, useEffect, useState } from 'react';

import { SocialSdk } from '../social-sdk';

type SocialContext = {
  social: SocialSdk | null;
};

export const SocialContext = createContext<SocialContext | undefined>(
  undefined
);

type SocialProviderProps = {
  children: ReactNode;
  debug?: boolean;
  onProvision?: (social: SocialSdk | null) => void;
  walletSelector: WalletSelector | null;
};

export const SocialProvider = ({
  children,
  debug,
  onProvision,
  walletSelector,
}: SocialProviderProps) => {
  const [social, setSocial] = useState<SocialSdk | null>(null);

  useEffect(() => {
    if (walletSelector) {
      const sdk = new SocialSdk(walletSelector, debug);
      setSocial(sdk);
    }
  }, [debug, walletSelector]);

  useEffect(() => {
    if (!onProvision) return;
    onProvision(social);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [social]);

  return (
    <SocialContext.Provider
      value={{
        social,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

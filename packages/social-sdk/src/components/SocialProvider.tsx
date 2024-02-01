import type { NetworkId, WalletSelector } from '@near-wallet-selector/core';
import { createContext, ReactNode, useEffect, useState } from 'react';

import { SocialSdk } from '../social-sdk';

type SocialContext = {
  social: SocialSdk;
};

export const SocialContext = createContext<SocialContext | undefined>(
  undefined
);

type SocialProviderProps = {
  children: ReactNode;
  debug?: boolean;
  networkId: NetworkId;
  onProvision?: (social: SocialSdk) => void;
  walletSelector: WalletSelector | null;
};

export const SocialProvider = ({
  children,
  debug,
  networkId,
  onProvision,
  walletSelector,
}: SocialProviderProps) => {
  const [social] = useState<SocialSdk>(new SocialSdk({ debug, networkId }));

  useEffect(() => {
    social.debug = debug ?? false;
    social.networkId = networkId;
    social.walletSelector = walletSelector;
  }, [debug, social, networkId, walletSelector]);

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

import { useWallet } from '@bos-web-engine/wallet-selector-control';
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
};

export const SocialProvider = ({ children }: SocialProviderProps) => {
  const { walletSelector } = useWallet();
  const [social, setSocial] = useState<SocialSdk | null>(null);

  useEffect(() => {
    if (walletSelector) {
      const sdk = new SocialSdk(walletSelector);
      setSocial(sdk);
    }
  }, [walletSelector]);

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

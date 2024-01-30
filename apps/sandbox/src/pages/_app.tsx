import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@bos-web-engine/sandbox/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import {
  MAINNET_SOCIAL_CONTRACT_ID,
  SocialProvider,
} from '@bos-web-engine/social-sdk';
import { NearIconSvg, Theme } from '@bos-web-engine/ui';
import {
  WalletSelectorControl,
  WalletSelectorProvider,
} from '@bos-web-engine/wallet-selector-control';
import type { WalletSelector } from '@near-wallet-selector/core';
import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useState } from 'react';

import { MAINNET_WALLET_SELECTOR_PARAMS } from '@/constants';
import s from '@/styles/app.module.css';

export default function App({ Component, pageProps }: AppProps) {
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );

  return (
    <WalletSelectorProvider
      contractId={MAINNET_SOCIAL_CONTRACT_ID}
      params={MAINNET_WALLET_SELECTOR_PARAMS}
      onProvision={(selector) => setWalletSelector(selector)}
    >
      <SocialProvider debug networkId="mainnet" walletSelector={walletSelector}>
        <Theme className={s.wrapper}>
          <header className={s.header}>
            <Link className={s.logo} href="/">
              <NearIconSvg />
              <h1>Sandbox</h1>
            </Link>

            <WalletSelectorControl />
          </header>

          <main className={s.main}>
            <Component {...pageProps} />
          </main>
        </Theme>
      </SocialProvider>
    </WalletSelectorProvider>
  );
}

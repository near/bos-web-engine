import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import { SocialProvider } from '@bos-web-engine/social-db-api';
import { NearIconSvg, Theme } from '@bos-web-engine/ui';
import {
  WalletSelectorControl,
  WalletSelectorProvider,
} from '@bos-web-engine/wallet-selector-control';
import type { WalletSelector } from '@near-wallet-selector/core';
import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MAINNET_WALLET_SELECTOR_PARAMS } from '@/constants';
import s from '@/styles/app.module.css';

/*
  TODO: Can we remove all of the Bootstrap CSS and library dependencies eventually? 
  The global Bootstrap styles cause all kinds of styling conflicts.
*/

export default function App({ Component, pageProps }: AppProps) {
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );

  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <WalletSelectorProvider
      contractId="social.near"
      params={MAINNET_WALLET_SELECTOR_PARAMS}
      onProvision={(selector) => setWalletSelector(selector)}
    >
      <SocialProvider debug networkId="mainnet" walletSelector={walletSelector}>
        <Theme className={s.wrapper}>
          <header className={s.header}>
            <Link className={s.logo} href="/">
              <NearIconSvg />
              <h1>BWE Demo</h1>
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

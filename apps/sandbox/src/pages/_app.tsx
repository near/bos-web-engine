import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@bos-web-engine/sandbox/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import { NearIconSvg, Theme } from '@bos-web-engine/ui';
import {
  WalletSelectorControl,
  WalletSelectorProvider,
} from '@bos-web-engine/wallet-selector-control';
import type { AppProps } from 'next/app';
import Link from 'next/link';

import { MAINNET_WALLET_SELECTOR_PARAMS } from '@/constants';
import s from '@/styles/app.module.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletSelectorProvider
      contractId="social.near"
      params={MAINNET_WALLET_SELECTOR_PARAMS}
    >
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
    </WalletSelectorProvider>
  );
}

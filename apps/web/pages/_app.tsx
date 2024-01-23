import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '../styles/globals.css';

import { NearIconSvg, Theme } from '@bos-web-engine/ui';
import { WalletSelectorControl } from '@bos-web-engine/wallet-selector-control';
import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useEffect } from 'react';

import { useWallet } from '../hooks/useWallet';
import s from '../styles/app.module.css';

/*
  TODO: Can we remove all of the Bootstrap CSS and library dependencies eventually? 
  The global Bootstrap styles cause all kinds of styling conflicts.
*/

export default function App({ Component, pageProps }: AppProps) {
  const { walletSelector, walletSelectorModal } = useWallet();

  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    /* 
      TODO: We should remove the hardcoded white/black background/text color to inherit our 
      actual theme colors. This would allow us to properly support light/dark mode by extending
      the <Theme> component (it's currently just set up with a hardcoded, dark color scheme).
    */

    <Theme className={s.wrapper} style={{ background: '#fff', color: '#000' }}>
      <header className={s.header}>
        <Link className={s.logo} href="/">
          <NearIconSvg />
          <h1>BWE Demo</h1>
        </Link>

        <WalletSelectorControl
          walletSelector={walletSelector}
          walletSelectorModal={walletSelectorModal}
        />
      </header>

      <main className={s.main}>
        <Component {...pageProps} />
      </main>
    </Theme>
  );
}

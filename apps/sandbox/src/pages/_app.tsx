import '@bos-web-engine/ui/styles/reset.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import type { AppProps } from 'next/app';
import s from '@/styles/app.module.css';
import Link from 'next/link';
import { NearIconSvg, Theme } from '@bos-web-engine/ui';
import { WalletSelectorControl } from '@bos-web-engine/wallet-selector-control';
import { useWallet } from '@/hooks/useWallet';

export default function App({ Component, pageProps }: AppProps) {
  const { walletSelector, walletSelectorModal } = useWallet();

  return (
    <Theme className={s.wrapper}>
      <header className={s.header}>
        <Link className={s.logo} href="/">
          <NearIconSvg />
          <h1>Sandbox</h1>
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

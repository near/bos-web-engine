import '@/styles/reset.css';
import '@/styles/globals.css';
import '@near-wallet-selector/modal-ui/styles.css';
import type { AppProps } from 'next/app';
import s from '@/styles/app.module.css';
import { CurrentWallet } from '@/components/CurrentWallet';
import Link from 'next/link';
import { NearIconSvg, Theme } from '@bos-web-engine/ui';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme className={s.wrapper}>
      <header className={s.header}>
        <Link className={s.logo} href="/">
          <NearIconSvg />
          <h1>Sandbox</h1>
        </Link>

        <CurrentWallet />
      </header>

      <main className={s.main}>
        <Component {...pageProps} />
      </main>
    </Theme>
  );
}

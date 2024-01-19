import '@/styles/reset.css';
import '@/styles/globals.css';
import '@near-wallet-selector/modal-ui/styles.css';
import type { AppProps } from 'next/app';
import s from '@/styles/app.module.css';
import { NearIconSvg } from '@/components/NearIconSvg';
import { CurrentWallet } from '@/components/CurrentWallet';
import Link from 'next/link';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={s.wrapper}>
      <header className={s.header}>
        <Link className={s.logo} href="/">
          <NearIconSvg className={s.logoSvg} />
          <h1 className={s.logoTitle}>Sandbox</h1>
        </Link>

        <CurrentWallet />
      </header>

      <main className={s.main}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

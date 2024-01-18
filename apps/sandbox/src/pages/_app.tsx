import '@/styles/globals.css';
import '@near-wallet-selector/modal-ui/styles.css';
import type { AppProps } from 'next/app';
import s from '@/styles/app.module.css';
import { NearIconSvg } from '@/components/NearIconSvg';
import { CurrentWallet } from '@/components/CurrentWallet';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={s.wrapper}>
      <header className={s.header}>
        <div className={s.logo}>
          <NearIconSvg className={s.logoSvg} />
          <h1 className={s.logoTitle}>Sandbox</h1>
        </div>

        <CurrentWallet />
      </header>

      <main className={s.main}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

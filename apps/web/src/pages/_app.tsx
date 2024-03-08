import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import { SocialProvider } from '@bos-web-engine/social-db';
import { NearIconSvg, ThemeProvider, Tooltip } from '@bos-web-engine/ui';
import {
  WalletSelectorControl,
  WalletSelectorProvider,
} from '@bos-web-engine/wallet-selector-control';
import type { WalletSelector } from '@near-wallet-selector/core';
import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { MAINNET_WALLET_SELECTOR_PARAMS } from '@/constants';
import { useFlagsStore } from '@/stores/flags';
import s from '@/styles/app.module.css';

export default function App({ Component, pageProps }: AppProps) {
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );

  // load application flags from browser storage on startup
  const updateFlags = useFlagsStore((state) => state.updateFlags);
  useEffect(() => {
    const savedFlags = localStorage.getItem('flags')
      ? JSON.parse(localStorage.getItem('flags') || '')
      : null;
    if (savedFlags) {
      updateFlags(savedFlags);
    }
  }, [updateFlags]);

  const flags = useFlagsStore((state) => state.flags);
  const headerRef = useRef(null);

  return (
    <WalletSelectorProvider
      contractId="social.near"
      params={MAINNET_WALLET_SELECTOR_PARAMS}
      onProvision={(selector) => setWalletSelector(selector)}
    >
      <SocialProvider debug networkId="mainnet" walletSelector={walletSelector}>
        <ThemeProvider defaultTheme="light" className={s.wrapper}>
          <header className={s.header} ref={headerRef}>
            <Link className={s.logo} href="/">
              <NearIconSvg />
              <h1>BWE Demo</h1>
            </Link>
            <div className={s.loaderIcon}>
              {flags?.bosLoaderUrl && (
                <Tooltip
                  content={
                    <>
                      Loading components from:<code>{flags.bosLoaderUrl}</code>
                    </>
                  }
                  side="right"
                  container={headerRef.current}
                  className={s.tooltip}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    fill="hsl(115, 42.60%, 46.50%)"
                    viewBox="0 0 256 256"
                  >
                    <path d="M24,96v72a8,8,0,0,0,8,8h80a8,8,0,0,1,0,16H96v16h16a8,8,0,0,1,0,16H64a8,8,0,0,1,0-16H80V192H32A24,24,0,0,1,8,168V96A24,24,0,0,1,32,72h80a8,8,0,0,1,0,16H32A8,8,0,0,0,24,96ZM208,64H176a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16Zm0,32H176a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16Zm40-48V208a16,16,0,0,1-16,16H152a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h80A16,16,0,0,1,248,48ZM232,208V48H152V208h80Zm-40-40a12,12,0,1,0,12,12A12,12,0,0,0,192,168Z"></path>
                  </svg>
                </Tooltip>
              )}
            </div>

            <WalletSelectorControl />
          </header>

          <main className={s.main}>
            <Component {...pageProps} />
          </main>
        </ThemeProvider>
      </SocialProvider>
    </WalletSelectorProvider>
  );
}

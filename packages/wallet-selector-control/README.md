# BWE Wallet Selector Control

This package provides a convenient UI to show the currently signed in wallet (or allow a user to sign in). It also provides a convenient way to initialize the wallet selector and access that instance via a provider and hook.

## Usage

An example of using `<WalletSelectorProvider />` and `<WalletSelectorControl />` inside your Next JS `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';

import type { AppProps } from 'next/app';
import { Theme } from '@bos-web-engine/ui';
import {
  useWallet,
  WalletSelectorProvider,
  WalletSelectorControl,
} from '@bos-web-engine/wallet-selector-control';

export default function App({ Component, pageProps }: AppProps) {
  const { account } = useWallet();

  console.log('Current wallet selector account:' account);

  return (
    <WalletSelectorProvider
      contractId="social.near"
      params={{
        network: 'mainnet',
        modules: [...],
      }}
    >
      <Theme>
        <header>
          <WalletSelectorControl />
        </header>

        <main>
          <Component {...pageProps} />
        </main>
      </Theme>
    </WalletSelectorProvider>
  );
}
```

## Hooks

This package also includes the following hooks for convenience:

- `useSocialProfile()` for retrieving the Social profile details of any NEAR account.
- `useWallet()` for easily accessing the wallet selector instance (and state) shared by the provider.

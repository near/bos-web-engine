# BWE Wallet Selector Control

This package provides a convenient UI to show the currently signed in wallet (or allow a user to sign in). This component allows you to remain in control of initializing wallet selector and the sign in modal - you'll just pass those references through to the component. 

## Usage

An example of using `<WalletSelectorControl />` inside your Next JS `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/styles/reset.css';
import '@near-wallet-selector/modal-ui/styles.css';

import type { AppProps } from 'next/app';
import { Theme } from '@bos-web-engine/ui';
import { WalletSelectorControl } from '@bos-web-engine/wallet-selector-control';
import { useWallet } from '@/hooks/useWallet';

export default function App({ Component, pageProps }: AppProps) {
  const { walletSelector, walletSelectorModal } = useWallet();

  return (
    <Theme>
      <header>
        <WalletSelectorControl
          walletSelector={walletSelector}
          walletSelectorModal={walletSelectorModal}
        />
      </header>

      <main>
        <Component {...pageProps} />
      </main>
    </Theme>
  );
}
```

## Hooks

This package also includes the following hooks for convenience:

- `useSocialProfile()` for retrieving the Social profile details of any NEAR account.
- `useWalletState()` for easily accessing account and wallet state from your wallet selector instance.

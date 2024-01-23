# BWE Wallet Selector Control

This package provides a convenient UI to show the currently signed in wallet (or allow a user to sign in). This component allows you to remain in control of initializing wallet selector and the sign in modal - you'll just pass those references through to the component. 

This package has peer dependencies on `@bos-web-engine/ui`, `@near-wallet-selector/core`, `@near-wallet-selector/modal-ui`, and React 18.

## Usage

An example of using `<WalletSelectorControl />` inside your Next JS `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
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

This pattern allows you to be in control of initializing the Wallet Selector library with whatever options you need. To look at an example for how `useWallet()` could be implemented check out [apps/sandbox/useWallet.ts](../../apps/sandbox/src/hooks/useWallet.ts).

## Hooks

This package also includes the following hooks for convenience:

- `useSocialProfile()` for retrieving the Social profile details of any NEAR account.
- `useWalletState()` for easily accessing account and wallet state from your wallet selector instance.

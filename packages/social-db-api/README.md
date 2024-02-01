# BWE Social DB API

This package allows you to easily interact with the `social.near` contract (Social DB).

## Standard Usage (Providers and Hooks)

The most convenient way to implement this package is through our hooks and providers. An example of using `<WalletSelectorProvider />`, `<SocialProvider />`, and `<WalletSelectorControl />` inside your Next JS `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/wallet-selector-control/styles.css';
import '@near-wallet-selector/modal-ui/styles.css';
import '@/styles/globals.css';

import {
  MAINNET_SOCIAL_CONTRACT_ID,
  SocialProvider,
  SocialDb,
} from '@bos-web-engine/social-db-api';
import { Theme } from '@bos-web-engine/ui';
import {
  WalletSelectorControl,
  WalletSelectorProvider,
} from '@bos-web-engine/wallet-selector-control';
import type { WalletSelector } from '@near-wallet-selector/core';
import type { AppProps } from 'next/app';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [walletSelector, setWalletSelector] = useState<WalletSelector | null>(
    null
  );
  const [social, setSocial] = useState<SocialDb | null>(null);

  console.log('Access these APIs in your root!', walletSelector, social);

  return (
    <WalletSelectorProvider
      contractId={MAINNET_SOCIAL_CONTRACT_ID}
      onProvision={(selector) => setWalletSelector(selector)}
      params={{
        network: 'mainnet',
        modules: [...],
      }}
    >
      <SocialProvider
        networkId='mainnet'
        onProvision={(db) => setSocial(db)}
        walletSelector={walletSelector}
      >
        <Theme>
          <header>
            <WalletSelectorControl />
          </header>

          <main>
            <Component {...pageProps} />
          </main>
        </Theme>
      </SocialProvider>
    </WalletSelectorProvider>
  );
}
```

### Debug Logs

To enable detailed debug logs related to RPC interaction, you can pass the `debug` prop:

```tsx
<SocialProvider debug ... />
```

### Hooks

This package also includes the following hooks for convenience:

- `useSocial()` for easily accessing the Social SDK instance shared by the provider.
- `useSocialProfile()` for easily accessing any account ID's social profile.

*NOTE: These hooks aren't accessible in the root of your application due to being outside the context of the providers (they would throw an error). Consider using the `onProvision` prop as shown above or move the consumers of these hooks into a child component of the providers.*

## Advanced Usage

In some cases you might need to initialize and manage an SDK instance yourself:

```ts
import { SocialDb } from '@bos-web-engine/social-db-api';
const db = new SocialDb({ ... });
```
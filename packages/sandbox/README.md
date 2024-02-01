# BWE Sandbox Component

An interactive sandbox for the web that allows you to experiment with writing BOS components and preview them in real time. Can be imported into a React or Next JS application.

## Usage

First, include the package's styles inside the root of your application. For Next JS, this would be your `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';
import '@bos-web-engine/sandbox/styles.css';
```

Then import the `<Sandbox />` component anywhere in your app:

```tsx
import { Sandbox } from '@bos-web-engine/sandbox';

export default function MyPage() {
  return (
    <div>
      <Sandbox />
    </div>
  );
}
```

To provide access to the current wallet selector context (for things like publishing components), you'll need to set up the `<WalletSelectorProvider />` to wrap `<Sandbox />`:

```tsx
import { WalletSelectorProvider } from '@bos-web-engine/wallet-selector-control';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletSelectorProvider
      contractId="social.near"
      params={{
        network: 'mainnet',
        modules: [...],
      }}
    >
      <Component {...pageProps} />
    </WalletSelectorProvider>
  );
}
```

# BWE UI

This package provides basic UI components to provide a consistent look and feel when developing within BWE.

## Usage

When using any of the UI components provided by this library, make sure they are wrapped by the `<Theme>` component. If they aren't wrapped, they won't have access to the correct CSS theme variables to render correctly.

This package has a peer dependency on React 18.

## Usage

First, include the package's styles and `<Theme />` wrapper inside the root of your application. For Next JS, this would be your `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';

import type { AppProps } from 'next/app';
import { Theme } from '@bos-web-engine/ui';

export default function App({ Component, pageProps }: AppProps) {
  const { walletSelector, walletSelectorModal } = useWallet();

  return (
    <Theme>
      <header>...</header>

      <main>
        <Component {...pageProps} />
      </main>
    </Theme>
  );
}
```

The global `reset.css` import makes sure we have a consistent baseline for all of our styles. For example, the reset makes sure all elements use `box-sizing: border-box;` and removes all default margins.

Now that we have `<Theme>` wrapping our entire app, you can feel free to use any of the components provided by this package:

```tsx
import { Button, Dropdown, Tooltip } from '@bos-web-engine/ui';

export function MyComponent() {
  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <Tooltip content="This is a cool button">
            <Button>Open Menu</Button>
          </Tooltip>
        </Dropdown.Trigger>

        <Dropdown.Content sideOffset={8}>
          <Dropdown.Item>Option 1</Dropdown.Item>
          <Dropdown.Item>Option 2</Dropdown.Item>
          <Dropdown.Item>Option 3</Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </>
  );
}
```

## Further Details

- The `<Dropdown>` component styles and re-exports this Radix UI primitive: https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- The `<Tooltip>` component is an abstraction built with this Radix UI primitive: https://www.radix-ui.com/primitives/docs/components/tooltip
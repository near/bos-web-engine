# BWE UI

This package provides basic UI components to provide a consistent look and feel when developing within BWE.

## Usage

When using any of the UI components provided by this library (or rendering BOS components as a gateway), make sure they are wrapped by the `<ThemeProvider>` component. If they aren't wrapped, they won't have access to the correct CSS theme variables to render correctly.

First, include the package's styles and `<ThemeProvider />` wrapper inside the root of your application. For Next JS, this would be your `_app.tsx` file:

```tsx
import '@bos-web-engine/ui/reset.css';
import '@bos-web-engine/ui/styles.css';

import type { AppProps } from 'next/app';
import { ThemeProvider } from '@bos-web-engine/ui';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="light">
      <header>...</header>

      <main>
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  );
}
```

The global `reset.css` import makes sure we have a consistent baseline for all of our styles. For example, the reset makes sure all elements use `box-sizing: border-box;` and removes all default margins.

Now that we have `<ThemeProvider>` wrapping our entire app, you can feel free to use any of the components provided by this package:

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

## Other Components

- The `<Dialog>` component is an abstraction built with this Radix UI primitive: https://www.radix-ui.com/primitives/docs/components/dialog
- The `<Dropdown>` component styles and re-exports this Radix UI primitive: https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- The `<Tooltip>` component is an abstraction built with this Radix UI primitive: https://www.radix-ui.com/primitives/docs/components/tooltip
- The `Tabs` export offers https://www.radix-ui.com/primitives/docs/components/tabs 

## Hooks

- `useTheme()` for reading and setting the current theme value (`light` or `dark`)

## SSR Theme Color Flash

To avoid flashing when rendering light vs dark mode, include the following in your Next JS `_document.tsx`:

```tsx
import { initializeSsrTheme } from '@bos-web-engine/ui';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>...</Head>
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: initializeSsrTheme() }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

If you choose `dark` as your default theme choice, you should initialize with: `initializeSsrTheme('dark')`.
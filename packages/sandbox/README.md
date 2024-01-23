# BWE Sandbox Component

An interactive sandbox for the web that allows you to experiment with writing BOS components and preview them in real time. Can be imported into a React or Next JS application.

This package has peer dependencies on `@bos-web-engine/ui` and React 18.

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

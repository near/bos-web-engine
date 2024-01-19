# BWE Sandbox Component

An interactive sandbox for the web that allows you to experiment with writing BOS components and preview them in real time. Can be imported into a React or Next JS application.

## Usage

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

## Notes

It might be worth considering encapsulating the sandbox preview with a Shadow Root to prevent any parent styles from affecting the preview. This library is worth looking into (see section regarding Styled Components): https://github.com/Wildhoney/ReactShadow

After some initial experiments, it appears that the Monaco editor doesn't function correctly when wrapped in a Shadow Root. We could decide to only wrap the preview with a Shadow Root.

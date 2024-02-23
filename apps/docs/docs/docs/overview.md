---
slug: /
sidebar_position: 1
---

# Overview

BOS Web Engine (BWE) is the next-gen decentralized frontend execution environment.

BWE brings decentralized frontend development significantly closer to standard React development and provides enhanced, browser-backed security.

Key Features:
- Upgrades developer experience (TypeScript, improved debugging)
- Access to more powerful components (npm packages, true hooks, standard JS environment)
- Performance optimization & tuning (configurable trust model)
- Increased security guarantees using iframe sandboxing, removing the burden of code-level security rules

:::note
"BOS Web Engine" is a working title and will change before launch
:::

## Example Component
`Foo.tsx`
```tsx
// import CSS module
import s from './Foo.module.css';

// import another BWE component
import Account from 'near://webengine.near/Account'

// import a BWE component from the same account using a relative path
import Post from './Post'

type Props = {
  message?: string;
};

function Foo({ message = "Hello!" }: Props) {
  return (
    <div className={s.wrapper}>
      <Account props={{accountId: 'bwe-demos.near'}} />
      <Post props={{content: 'Hello World'}} />
      <p>{message}</p>
    </div>
  );
}

export default Foo as BWEComponent<Props>;
```

`Foo.module.css`
```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

## How it Works

1. Component code is executed with Preact in hidden iframes with sandboxing features enabled
2. When the component in the iframe has performed a render, it emits an event with the DOM produced
3. The outer window application (OWA) listens for render events from all iframes and stitches their DOM outputs together onto the visible page

Javascript runs in sandboxes, HTML/CSS is returned

![Container to Outer Window Application](/img/container-owa.png)
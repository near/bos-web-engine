---
sidebar_position: 2
---

# Imports

## npm

When importing npm packages, they are fetched from esm.sh, an npm package CDN, behind the scenes.

**This means that you can import any npm package directly in your BOS component without having to install it locally.**

Note that not every npm package will function within the BOS environment

### Supported Packages

:::warning TODO
:::

For more info, see [Limitations](/building-decentralized-frontends/limitations)

## BOS Components

Other BOS components can be imported and embedded within your component.

### Relative Imports

Components published by the same NEAR account can be imported using relative paths.

```tsx
import MyComponent from './MyComponent'
```

### External Components

Any BOS Component can be imported using the following syntax

```
near://<account-id>/<Component>
```

e.g.
```tsx
import Message from 'near://bwe-web.near/Message'
```
---
sidebar_position: 3
---

# Imports

## npm

When importing npm packages, they are fetched in the user's browser from esm.sh, an npm package CDN.

**This means that you can import npm packages directly in your BWE component without having to install them.**

Note that not every npm package will function within the BWE environment

### Supported Packages

The BWE team has a tracker [here](https://bos-web-engine.vercel.app/webengine.near/NPM.Tracker) which categorizes known compatability of packages. Expect the list to grow over time.

If you have certain packages which you would like to use within BWE, please chime in on [this thread](https://github.com/near/bos-web-engine/discussions/166)

#### Expected Incompatibility

Some packages are expected to not work within BWE due to its architecture and security model. Packages which rely on the following are expected to not work:

- direct access to the `window` or `document` objects
:::warning TODO
andy
:::

## BWE Components

Other BWE components can be imported and embedded within your component.

### Dedicated Import Syntax

Any BWE Component can be imported using the following syntax

```
near://<account-id>/<Component>
```

e.g.
```tsx
import Message from 'near://bwe-web.near/Message'

// ...

// in use
<Message />
```

Since components use default exports, you can import them using any name you like. Note the difference between the imported name and the component path:

```tsx
import Foo from 'near://bwe-web.near/Bar'
```

### Relative Imports

Components published by the same NEAR account and in the same directory can be imported using relative paths.

```tsx
import Foo from './Foo'
```

This only works for `./` paths. Other relative imports such as `../Foo` are not implemented.

:::tip
Directory support is a work in progress. If you place `/` separators in your component name when working in the sandbox, it will be treated as a directory separator.

From a component named `Foo/Bar.tsx`, relative imports will only be resolvable for other components starting with `Foo/`.
:::


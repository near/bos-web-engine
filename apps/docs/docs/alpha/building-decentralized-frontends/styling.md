---
sidebar_position: 2
---

# Styling (CSS)

## CSS Modules

You can currently style BWE components with CSS modules. Each component has an associated CSS file which is saved on-chain alongside component source code.

In the sandbox, a CSS module is created automatically for every component.

Two syntaxes are supported for CSS modules imports. In the component `Foo.tsx`, you can use either of the following:
```tsx
import s from './Foo.module.css';
```

```tsx
import s from './styles.module.css';
```

:::warning
Although the second example above is what you will find in our starter code, we recommend using the pattern from the first example since it may be the only version that is allowed once local code editor support is implemented.
:::

### Features

#### CSS Nesting

CSS Nesting is supported. Here is an example of using it to style child elements and pseudo-classes:

```css
.entry {
  padding: 1rem;

  > input {
    width: 20rem;
  }

  > button {
    background-color: #33b074;

    &:hover {
      background-color: #2f7c57;
    }
    
    &:active {
      background-color: #174933;
    }
  }
}
```

### Learn from Our Examples

From the sandbox, use the search icon in left sidebar to pull up `webengine.near` components like `webengine.near/SocialFeedPage`

## CSS-in-JS

We have CSS-in-JS support [on our roadmap](https://github.com/near/bos-web-engine/issues/7), but it is not yet available.
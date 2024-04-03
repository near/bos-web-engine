---
sidebar_position: 5
---

# Optimization

The options presented here can lead to decreased security and should only be used with clear understanding of the implications.

## Trust Mode

The default trust model of RoC is to encourage risk-free composability by sandboxing all embedded RoC components by default. There are cases where this might not be necessary, such as:
- embedding your own components
- embedding components from other developers you trust
- embedding components you have audited for malicious behavior and are locked to a specific version

If a component does not need to be sandboxed, you can change the `trust` mode on the embed and the component will be directly executed in the same container instead of having a separate sandboxed iframe created for it. This can yield significant performance improvements for pages which render many components (e.g. social feeds).

There are two modes for loading a Component: **sandboxed** (default) and **trusted**. These modes make it possible to define the boundaries within Component trees, granting developers more control over the balance of performance and security in their applications.

### Sandboxed

Sandboxed Components are run in a dedicated container, independent of their parent Component's context. All communication
between parent and child (e.g. re-rendering, `props` method invocation) is handled via `postMessage` communication through
the outer application.

If no trust modes are specified, every Component is sandboxed in a separate container.

### Trusted

When a Component is loaded as **trusted**, the parent Component inlines the child Component definition into its
own container and renders it as a child DOM subtree.

In short, embedding a component as trusted removes some application overhead but gives the embedded component the ability to read or manipulate the parent component's state and DOM.

### Usage

By default, Components are loaded in **sandboxed** mode. To change the loading policy, configure the `trust` prop with a desired `mode` property

The following modes are supported:
 - **sandboxed** (default): load this Component in its own container
 - **trusted**: load this Component within the parent Component
 - **trusted-author**: extends the **trusted** mode by inlining this Component and all descendant Components from the same author

#### Sandboxed
```jsx
import Foo from 'near://bwe-demos.near/Foo'

// ...

{/* omitting the `trust` prop would have the same behavior */}
<Foo trust={{ mode: "sandboxed" }} src="ex.near/Parent" />
```

#### Trusted
```jsx
import Foo from 'near://bwe-demos.near/Foo'

// ...

<Foo trust={{ mode: "trusted" }} src="ex.near/Parent" />
```

#### Trusted Author
```jsx
import Foo from 'near://bwe-demos.near/Foo'

// ...

{/* Root Component  */}
<Foo trust={{ mode: "trusted-author" }} src="ex.near/Parent" />

{/* Parent Component  */}
<>
  {/* trusted: same author  */}
  <Foo src="ex.near/X" id="x-implicit" />

  {/* trusted: same author, explicitly trusted; note that descendants of Y authored by ex.near will still be trusted */}
  <Foo src="ex.near/Y" trust={{ mode: "trusted" }} id="y" />

  {/* sandboxed: explicitly sandboxed, same author behavior is overridden */}
  <Foo src="ex.near/X" trust={{ mode: "sandboxed" }} id="x-sandboxed" />

  {/* sandboxed: different author, no trust specified */}
  <Foo src="mal.near/X" id="x-mal" />
</>
```

### Notes

- The root Component is always loaded as **sandboxed**.
- The `trust` prop must be specified as an object literal with literal values; i.e. the value may not contain any variables
    or be returned from a function. Loading happens prior to rendering, so the trust must be statically parseable. Any
    Component renders with a `trust` value that cannot be parsed statically are treated as **sandboxed**.
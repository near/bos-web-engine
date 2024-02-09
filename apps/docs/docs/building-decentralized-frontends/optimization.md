---
sidebar_position: 4
---

# Optimization

## Trust Mode

There are two modes for loading a Component: **sandboxed** and **trusted**. These modes make it possible to create boundaries
within Component trees, granting developers more control over the balance of performance and security in their applications.

### Sandboxed

Sandboxed Components are run in a dedicated container, independent of their parent Component's context. All communication
between parent and child (e.g. re-rendering, `props` method invocation) is handled via `postMessage` communication through
the outer application.

### Trusted

When a Component is loaded as **trusted**, the parent Component inlines the child Component definition into its
own container and renders it as a child DOM subtree. This approach avoids the overhead in rendering via event propagation
at the cost of executing external JSX code within the same context.

### Usage

By default, Components are loaded in **sandboxed** mode. To configure Component loading, use the `trust` prop to configure
the loading policy via the `mode` property. The following modes are supported:
 - **sandboxed** (default): load this Component in its own container
 - **trusted**: load this Component within the parent Component
 - **trusted-author**: extends the **trusted** mode by inlining this Component and all descendant Components from the same author

#### Sandboxed
```jsx
{/* omitting the `trust` prop would have the same behavior */}
<Component trust={{ mode: "sandboxed" }} src="ex.near/Parent" />
```

#### Trusted
```jsx
<Component trust={{ mode: "trusted" }} src="ex.near/Parent" />
```

#### Trusted Author
```jsx
{/* Root Component  */}
<Component trust={{ mode: "trusted-author" }} src="ex.near/Parent" />

{/* Parent Component  */}
<>
  {/* trusted: same author  */}
  <Component src="ex.near/X" id="x-implicit" />

  {/* trusted: same author, explicitly trusted; note that descendants of Y authored by ex.near will still be trusted */}
  <Component src="ex.near/Y" trust={{ mode: "trusted" }} id="y" />

  {/* sandboxed: explicitly sandboxed, same author behavior is overridden */}
  <Component src="ex.near/X" trust={{ mode: "sandboxed" }} id="x-sandboxed" />

  {/* sandboxed: different author, no trust specified */}
  <Component src="mal.near/X" id="x-mal" />
</>
```

### Notes

- The root Component is always loaded as **sandboxed**.
- The `trust` prop must be specified as an object literal with literal values; i.e. the value may not contain any variables
    or be returned from a function. Loading happens prior to rendering, so the trust must be statically parseable. Any
    Component renders with a `trust` value that cannot be parsed statically are treated as **sandboxed**.
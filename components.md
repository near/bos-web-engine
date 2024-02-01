# Component Usage

### Overview

This document describes the concepts required for creating Components to run on the BOS Web Engine.

### Terms
- **Outer Application** is the application responsible for rendering Components and brokers messages between containers.
- **Components** refer to the functions returning JSX to be rendered in BOS Web Engine.
- **Root Component** refers to the top-level Component loaded by the outer application.
- **Containers** provide the runtime context for one or more Components. They are implemented as sandboxed `<iframe>`s,
communicating with other containers via the outer application's `window.postMessage` method.
- **Component ID**s uniquely identify Components rendered within a parent Component. They are roughly analogous to `key`
in React.

### Trust Mode

There are two modes for loading a Component: **sandboxed** and **trusted**. These modes make it possible to create boundaries
within Component trees, granting developers more control over the balance of performance and security in their applications.

#### Sandboxed

Sandboxed Components are run in a dedicated container, independent of their parent Component's context. All communication
between parent and child (e.g. re-rendering, `props` method invocation) is handled via `postMessage` communication through
the outer application.

#### Trusted

When a Component is loaded as **trusted**, the parent Component inlines the child Component definition into its
own container and renders it as a child DOM subtree. This approach avoids the overhead in rendering via event propagation
at the cost of executing external JSX code within the same context.

#### Usage

By default, Components are loaded in **sandboxed** mode. To configure Component loading, use the `trust` prop to configure
the loading policy via the `mode` property. The following modes are supported:
 - **sandboxed** (default): load this Component in its own container
 - **trusted**: load this Component within the parent Component
 - **trusted-author**: extends the **trusted** mode by inlining this Component and all descendant Components from the same author

##### Sandboxed
```jsx
{/* omitting the `trust` prop would have the same behavior */}
<Component trust={{ mode: "sandboxed" }} src="ex.near/Parent" />
```

##### Trusted
```jsx
<Component trust={{ mode: "trusted" }} src="ex.near/Parent" />
```

##### Trusted Author
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

#### Notes

- The root Component is always loaded as **sandboxed**.
- The `trust` prop must be specified as an object literal with literal values; i.e. the value may not contain any variables
    or be returned from a function. Loading happens prior to rendering, so the trust must be statically parseable. Any
    Component renders with a `trust` value that cannot be parsed statically are treated as **sandboxed**.

### Component IDs

To ensure Components are uniquely addressable by the application, BOS Web Engine uses a Component's ancestors' path names
as a prefix to create a base Component ID. So for a child Component `Child` under `Parent`, which in turn is a child under
`Root`, the base Component ID would include a concatenation of `Child>Parent>Root`.

However, the base is not sufficient for multiple instances of the same Component under the same Parent. In these instances
the child Component must specify an `id` prop value uniquely identifying itself under the Parent Component. Rendering multiple
instances of the same Component under the same Parent should be considered undefined behavior.

As a best practice, we recommend new Components be written with a meaningful `id` value to avoid potential collisions in the
future.

#### Examples

Assume all code examples are from `ex.near/Parent`:

```jsx
<Component src="ex.near/Child" />
```
✅
The base ID is sufficient to identify a single child Component.

```jsx
<Component src="ex.near/Child" />
<Component id="2nd" src="ex.near/Child" />
```
✅
The second Component has an explicit `id` value, preventing any collisions. While this does work, it would be much less brittle
if both child Components had unique `id` values.

```jsx
<Component src="ex.near/Child" />
<Component src="ex.near/Child" />
```
❌ 
Without unique `id` values, child Components cannot be differentiated by the outer application.

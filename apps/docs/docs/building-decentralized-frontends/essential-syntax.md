---
sidebar_position: 1
---

# Essential Syntax

This document describes the essential syntax required for creating Components to run on the BOS Web Engine. All BOS developers should familiarize themselves with the contents of this document.

## Component IDs

When embedding multiple instances of the same BOS Component at the same level within a parent Component, each child must be given an explicit ID in order for the engine to differentiate between them during renders. This is similar to the `key` prop in React, but is separately required by the BOS Web Engine.

A very common use case where this is encountered is when rendering a `Component` within a `.map()` call on an array of data.

As a best practice, we recommend new Components be written with a meaningful `id` value to avoid potential collisions in the
future.

### Examples

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

<details>
  <summary>More Details</summary>
  <p>To ensure Components are uniquely addressable by the application, BOS Web Engine uses a Component's ancestors' path names
as a prefix to create a base Component ID. So for a child Component `Child` under `Parent`, which in turn is a child under
`Root`, the base Component ID would include a concatenation of `Child>Parent>Root`.</p>
<p>However, the base is not sufficient for multiple instances of the same Component under the same Parent. In these instances
the child Component must specify an `id` prop value uniquely identifying itself under the Parent Component. Rendering multiple
instances of the same Component under the same Parent should be considered undefined behavior.</p>
</details>
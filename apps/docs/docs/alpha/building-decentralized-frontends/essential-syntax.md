---
sidebar_position: 1
---

# Essential Syntax

This document describes the essential syntax required for creating Components to run on the BOS Web Engine. All BOS developers should familiarize themselves with the contents of this document.

## Component Export

Every BWE component must have a valid export. This can be a named export where the name is `BWEComponent` or a default export. If you are not opinionated about your exports, we recommend following the example set by the boilerplate code generated in the sandbox.

## Component IDs

When embedding multiple instances of the same BWE Component at the same level within a parent Component, each child must be given an explicit ID in order for the engine to differentiate between them during renders. This is similar to the `key` prop in React, but is separately required by BOS Web Engine.

A very common use case where this is encountered is when rendering a `Component` within a `.map()` call on an array of data.

As a best practice, we recommend new Components be written with a meaningful `id` value to avoid potential collisions in the
future.

### Examples

Assuming we have an import of `import Child from near://bwe-demos.near/Child`:

---

```jsx
<Child />
```
✅
The automatically generated ID is sufficient to identify a single child Component.

---

```jsx
<Child />
<Child id="2nd" />
```
✅
The second Component has an explicit `id` value, preventing any collisions. While this does work, it would be much less brittle
if both child Components had unique `id` values.

---

```jsx
<Child id="1st" />
<Child id="2nd" />
```
✅✅
Ideal, makes future maintenance easier.

---

```jsx
<Child />
<Child />
```
❌ 
Without unique `id` values, child Components cannot be differentiated by the outer application.

---

<details>
  <summary>More Details</summary>
  <p>To ensure Components are uniquely addressable by the application, BOS Web Engine uses a Component's ancestors' path names as a prefix to create a base Component ID. So for a child Component `Child` under `Parent`, which in turn is a child under `Root`, the base Component ID would include a concatenation of `Child>Parent>Root`.</p>
<p>Rendering multiple instances of the same Component under the same Parent should be considered undefined behavior.</p>
</details>
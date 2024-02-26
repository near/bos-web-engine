---
sidebar_position: 3
---

# Building Decentralized Frontends

A BWE component looks, for the most part, like a standard React component. There are some syntax differences and additions where necessary to function within the architecture of the engine.

## Terms
- **Outer Window Application (OWA)** is the application responsible for rendering Components and brokers messages between containers.
- **Components** refer to the functions returning JSX to be rendered in BOS Web Engine. Their source is stored on chain in the SocialDB contract.
- **Root Component** refers to the top-level Component loaded by the outer application.
- **Containers** provide the runtime context for one or more Components. They are implemented as sandboxed `<iframe>`s,
communicating with other containers via the outer window application's `window.postMessage` method.
---
sidebar_position: 3
---

# Build

> Creating Decentralized Frontends and components w/ BOS Web Engine

A BWE component looks, for the most part, like a standard React component. There are some syntactical variations and essential enhancements to adapt seamlessly to the engine's framework.

## Terms

- **Outer Window Application (OWA)** - The application responsible for rendering Components and brokers messages between containers.

- **Components** - The functions returning JSX to be rendered in BOS Web Engine. Their source is stored on chain in the SocialDB contract.

- **Root Component** - The top-level Component loaded by the outer application.

- **Containers** - Provide the runtime context for one or more Components. They are implemented as sandboxed `<iframe>`s,
communicating with other containers via the outer window application's `window.postMessage` method.

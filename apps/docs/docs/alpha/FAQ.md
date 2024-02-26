---
sidebar_position: 5
---
# FAQ

## General

### When will the previous BOS VM stop being supported?

The transition will occur in a few stages.

There will be a beta period where both the VM and BWE are supported while we ensure BWE is stable and performant. During this period, we will encourage developers to build on BWE but breaking changes are more likely to occur as improvements to the engine are identified.

Once we are confident in the production readiness of BWE, we will start a grace period during which the VM will continue to be supported while the community works to migrate existing BOS components to BWE. We will assist in this with ample guidance and hopefully some tooling to make the process easier.

After the grace period, the VM will be deprecated and removed from the BOS runtime, since the security guarantees it provides are not sufficient for the future of BOS.

## Building Components with BWE

### What language and framework are BOS components written in?

BOS components are written in TypeScript or JavaScript and use Preact as the rendering engine with the React compatibility layer enabled. One of the main goals of BWE is to have syntax that is minimally different from vanilla (p)react, and only stray from it where necessary to accommodate the architecture of the engine and sandbox communication patterns.

### What non-BOS code can I import?

See the [npm section of our imports documentation](/alpha/building-decentralized-frontends/imports#npm) for full details. You can attempt to import any npm package, but not all will work due to the sandboxed environment.

### What are the performance limits? How many sandboxed components can reasonably be rendered on a page?

We don't have hard numbers to share here since our engine is constantly evolving, but the Social Feed app in our [demo list](http://bwe.near.dev) is a great example of a page with many components. We've found that the load time is reasonable for real world usage even on mobile devices with lower than average memory.

### Are browser APIs like Canvas supported?

We plan for these to be supported, but they aren't yet.

Once they are supported, there may be some caveats since access to browser APIs must be proxied— with isolation in mind— from sandbox code to the outer window.

If you have a strong need for a particular browser API, please let us know by [opening an Discussion](https://github.com/near/bos-web-engine/discussions/new?category=misc) on our GitHub repository.

Tracking: [#20](https://github.com/near/bos-web-engine/issues/20)

### Can I use other frontend frameworks?

No, BWE is implemented by tying directly into the render pipeline of Preact. Discussions have occurred about the feasibility of supporting other frameworks, but it would be a sizeable engineering effort.

You may be able to import component built in other frameworks if they can be bundled as Web Components

### Can I use web components?

Theoretically this is possible since Preact supports web componentsm, but we have not tested this and it is not officially supported.

### What about Shadow Realms?

Shadow Realms is a proposed browser standard which would offer some of the same benefits as BWE. Implementation of Shadow Realms is occuring slowly and it is unclear when it will be available in all major browsers, and whether it would be possible to use it in a way which is compatible with the BWE architecture. We will continue to monitor the progress of Shadow Realms.

### How do I interact with the external services?

You can directly call out to external services with the browser-native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) or any other request library, but keep in mind that external service integrations can diminish the decentralization benefits of BOS if they are not decentralized themselves.

### Can my code editor handle component syntax?

Most component code is standard TSX which editors like VS Code can handle, but type definitions will be missing until a system is implemented to provide them.

## Architecture

### Why is isolation important? What are the attack vectors?

To achieve the high level of composability that is a central goal of BOS, developers must be able to embed components from other authors without the burden of personally auditing the code for malicious behavior. This is especially true if components are embedded dynamically and it is impossible for the dapp developer to know in advance which components will be loaded (e.g. a social post feed which can render components inline).

**Example attack**
Bob develops a defi dapp which has a button to initiate a transaction to transfer some value (e.g. fungible tokens). He then embeds a seemingly innocent BOS component from another author in his dapp— perhaps it is a UI component to render a nice accordion element. In that accordion element is code which directly modifies the DOM of the previously mentioned button, and causes it to present users with a transaction to transfer value to the malicious component author instead of wherever it was supposed to go. A user goes to Bob's defi dapp and clicks the transfer button, but doesn't realize the transaction they are confirming has been tampered with.

### How are off-chain dependencies decentralized?

Packages are loaded via CDNs, and most CDNs have decentralization architecture built in. That being said, it is possible for a CDN to go offline or be blocked in a particular region. In this case, the dependency will fail to load which may cause the component to fail to render.

In the spirit of progressive decentralization, BWE will launch with dependencies being powered by a single npm CDN. In the future, we will explore the following:
- a package registry hosted on an inherently decentralized network (e.g. IPFS)
- creating CDN-agnostic import syntax where developers can specify the package and version they require then leave resolution up to the gateway at runtime

### How do cross-components function calls work?

Containers maintain a set of callbacks, defined within the container, which are available to be "invoked" across container boundaries. This includes functions passed via `props` and function arguments passed to `props` functions. When an external container needs to invoke one of these callbacks, the external container requests the outer application to send a message to the target container identifying the method and arguments.

See [architecture.md](/alpha/further-reading/architecture.md#component-callbacks) for more details.

### What happens when I set an `onClick` function and it gets called?

When a DOM event handler (e.g. `onClick`, `onChange`) is fired, the outer application sends a message to the container to which the DOM element belongs. This is related to how container callbacks are invoked, but DOM callbacks are unique in that:
- the invocation originates in the outer application rather than from another container
- the callback is always invoked with the `event` object, for which only a subset of the fields are sent since `event` is not serializable
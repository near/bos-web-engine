# Vision PR/FAQ

> ⚠️ This is a WIP press release / FAQ for the eventual launch of BOS Web Engine. Its primary purpose is to communicate the project's vision and maintain alignment on the criteria for success. It does not necessarily represent the project's current state, as the contents here may change during implementation.


## Press Release

Pagoda makes major enhancements to BOS decentralized front-end development with the release of BOS Web Engine (BWE).

BWE is a new execution environment for BOS components featuring:

- Increased security guarantees
- Modern web development features such as `npm` dependencies, TypeScript, and hooks
- Advanced features for performance optimizations

Until now, BOS components required compatibility with [near-social's VM](https://github.com/nearsocial/vm). This VM operates on a stringent security protocol that meticulously scrutinizes components line-by-line, and only executes statements when they are recognized, understood, and confirmed to be secure. Unfortunately, this model leads to a persistent balancing act between enhancing the functionality of BOS components and ensuring their security. As a result, importing code that expects to execute in a typical browser environment is impossible.

BWE takes an alternative approach by leveraging the sandboxing feature of iframes in web browsers to isolate the execution of each component.
	
	Here's how it works:
	
	- Code for each component is sent to a hidden iframe, accompanied by an instance of [Preact](https://preactjs.com/), a "fast 3kB alternative to React with the same modern API"
	- Within this iframe, Preact executes the component's code. Once rendered, the resulting UI is transferred out of the iframe.
	- The outputs from all iframes are then assembled onto the page.
	
	Imagine each component operating as a self-contained mini-application with access to a communication system to synchronize with other components. This architecture allows for significantly fewer restrictions on the code that components can execute since the execution takes place in an isolated sandbox and cannot reach the main web application. Additionally, a wide set of javascript libraries and third party React components can be imported and used seamlessly in BWE components.

## F.A.Q

### General

#### When will the previous VM stop being supported?

The transition will occur in a few stages.

There will be a beta period where both the VM and BWE are supported while we ensure BWE is stable and performant. During this period, we will encourage developers to build on BWE but breaking changes are more likely to occur as improvements to the engine are identified.

Once we are confident in the production readiness of BWE, we will start a grace period during which the VM will continue to be supported while the community works to migrate existing BOS components to BWE. We will assist in this with ample guidance and hopefully some tooling to make the process easier.

After the grace period, the VM will be deprecated and removed from the BOS runtime, since the security guarantees it provides are not sufficient for the future of BOS.

### Building BOS Components with BWE

#### What language and framework are BOS components written in?

BOS components are written in TypeScript or JavaScript and use Preact as the rendering engine with the React compatibility layer enabled. One of the main goals of BWE is to have syntax that is minimally different from vanilla (p)react, and only stray from it where necessary to accommodate the architecture of the engine and sandbox communication patterns.

See [components.md](components.md) for a detailed overview of the syntax required to build BOS components.

#### What non-BOS code can I import?

You can import npm packages via a CDN like https://esm.sh/

You can expect for packages which are not dependent on direct access to the DOM or `window` object to work out of the box. Many packages which export custom React components are also supported due to our inclusion of preact/compat in the sandboxed environment.

Packages which may not work:
- animation libraries
- canvas libraries
- packages which tie into the render process by usage of `useLayoutEffect`

#### How do I convert an existing (p)react application?

See [migrating.md](migrating.md) for guidance on migrating an existing (p)react application to BOS.

#### What are the performance limits? How many sandboxed components can reasonably be rendered on a page?

> TBD

#### Are browser APIs like Canvas supported?

Yes, but there may be some caveats since access to browser APIs must be proxied— with isolation in mind— from sandbox code to the outer window. See [components.md](components.md#browser-apis) for more details.

#### Can I use other frontend frameworks?

No, BWE is implemented by tying directly into the render pipeline of Preact. Discussions have occurred about the feasibility of supporting other frameworks, but it would be a sizeable engineering effort.

You may be able to import component built in other frameworks if they can be bundled as Web Components

#### Can I use web components?

Yes, Preact supports embedding Web Components. See [components.md](components.md#web-components) for more details.

#### What about Shadow Realms?

Shadow Realms are a proposed browser standard which would offer some of the same benefits as BWE. Implementation of Shadow Realms is still in the early stages and it is unclear when it will be available in all major browsers, and whether it would be possible to use it in a way which is compatible with the BOS architecture. We will continue to monitor the progress of Shadow Realms.

#### How do I optimize performance?

##### Trust Mode

The default trust model of BOS is to encourage risk-free composability by sandboxing all embedded BOS components by default. There are cases where this might not be necessary, such as:
- embedding your own components
- embedding components from other developers you trust
- embedding components you have audited for malicious behavior and are locked to a specific version

If a component does not need to be sandboxed, you can change the `trust` mode on the embed and the component will be directly executed in the same container instead of having a sandboxed iframe created for it. This can yield significant performance improvements for pages which render many components (e.g. social feeds).

See [performance.md](performance.md#trust) for the syntax to change the trust mode of an embedded component

##### Best Practices

See [performance.md](performance.md#best-practices) for a general list of best practices for optimizing performance of BOS components.

#### How do I interact with the external services?

You can directly call out to external services with the browser-native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) or any other request library, but keep in mind that external service integrations can diminish the decentralization benefits of BOS if they are not decentralized themselves.

#### Can my code editor handle component syntax?

> TBD (we might provide a typescript definition package to help with this)

#### What happens when I set an `onClick` function and it gets called?

### Architecture

#### Why is isolation important? What are the attack vectors?

To achieve the high level of composability that is a central goal of BOS, developers must be able to embed components from other authors without the burden of personally auditing the code for malicious behavior. This is especially true if components are embedded dynamically and it is impossible for the dapp developer to know in advance which components will be loaded (e.g. a social post feed which can render components inline).

**Example attack**
Bob develops a defi dapp which has a button to initiate a transaction to transfer some value (e.g. fungible tokens). He then embeds a seemingly innocent BOS component from another author in his dapp— perhaps it is a UI component to render a nice accordion element. In that accordion element is code which directly modifies the DOM of the previously mentioned button, and causes it to present users with a transaction to transfer value to the malicious component author instead of wherever it was supposed to go. A user goes to Bob's defi dapp and clicks the transfer button, but doesn't realize the transaction they are confirming has been tampered with.

#### How are off-chain dependencies decentralized?

Packages are loaded via CDNs, and most CDNs have decentralization architecture built in. That being said, it is possible for a CDN to go offline or be blocked in a particular region. In this case, the dependency will fail to load which may cause the component to fail to render.

In the spirit of progressive decentralization, BWE will launch with dependencies being powered directly by CDN URLs. In the future, we will explore the following:
- a package registry hosted on an inherently decentralized network (e.g. IPFS)
- creating CDN-agnostic import syntax where developers can specify the package and version they require then leave resolution up to the gateway at runtime

#### Why is SocialDB integration not built in?

In keeping with our goal to be minimally different from vanilla (p)react, we have opted to have SocialDB integration be provided as an external library instead of built into the engine.

#### How do cross-components function calls work?

> @andy (very high level summary then link to architecture doc)

#### What are the downsides of using iframes?

> @andy

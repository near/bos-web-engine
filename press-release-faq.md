# Vision PR/FAQ

> ⚠️ This is a mock press release / FAQ for the eventual launch of BWE, it does not necessarily represent
the current state of the project and the contents here may change during the course of implementation.
It is used for communicating the vision of the project and maintaining alignment on the criteria for success.

## Press Release

Pagoda is proud to announce the production release of the BOS Web Engine (BWE).

BWE is the new execution environment for BOS components which offers a more reliable security guarantee and
enables modern web development features which have previously been missing like npm dependencies, TypeScript,
........... along with advanced features for performance optimizations.

Until now, BOS components have been written to be compatible with the "VM". This VM processes components line
by line and executes statements only if it has been built top understand them and knows them to be safe. It
relies on this restrictive processing for security. This model creates a constant tug of war between expanding
capability of BOS components and maintaining security. Importing code which expects to execute in a typical
browser environment is not possible.

In contrast, BWE leverages the sandboxing configuration of iframes buiilt into browsers to isolate the execution
of each component. Each component's code is passed to an invisible iframe along with an instance of Preact. Preact
executes the components and the rendered output is serializes and passed out of the iframe. Then, the output of all
the iframes is composed together into a single tree for render on the page. One way to think of this is that each
component is run as its own isolated applet and given a messaging system to integrate with other components. This
allows being significantly less restrictive with the code a component can run, since the only surface of exposure
to the OWA is DOM nodes. It also means code written for a standard browser or Preact environment can be imported
and run by components.

## F.A.Q

### General

#### When will the previous VM stop being supported?

The transition will occur in a few stages.

There will be a beta period where both the VM and BWE are supported while we ensure BWE is stable and
performant. During this period, we will encourage developers to build on BWE but breaking changes
are more likely to occur as improvements to the engine are identified.

Once we are confident in the production readiness of BWE, we will start a grace period during
which the VM will continue to be supported while the community works to migrate existing BOS components to
BWE. We will assist in this with ample guidance and hopefully some tooling to make the process easier.

After the grace period, the VM will be deprecated and removed from the BOS runtime, since the security
guarantees it provides are not sufficient for the future of BOS.

### Building BOS Components with BWE

#### What language and framework are BOS components written in?

BOS components are written in TypeScript or JavaScript and use Preact as the rendering engine with the React compatibility layer enabled.
One of the main goals of BWE is to have syntax that is minimally different from vanilla (p)react, and only stray from it where
necessary to accomodate the architecture of the engine and sandbox communication patterns.

See [components.md](components.md) for a detailed overview of the syntax required to build BOS components.

#### What non-BOS code can I import?

You can import npm packages via a CDN like https://esm.sh/

You can expect for packages which are not dependent on direct access to the DOM or `window` object to work out of
the box. Many packages which export custom React components are also supported due to our inclusion of preact/compat
in the sandboxed environment.

Packages which may not work:
- animation libraries
- canvas libraries
- packages which tie into the render process by usage of `useLayoutEffect`

#### How do I convert an existing (p)react application?

See [migrating.md](migrating.md) for guidance on migrating an existing (p)react application to BOS.

#### What are the performance limits? How many sandboxed components can reasonably be rendered on a page?

> TBD

#### Are browser APIs like Canves supported?

Yes, but there may be some caveats since access to browser APIs must be proxied— with isolation in mind— from
sandbox code to the outer window. See [components.md](components.md#browser-apis) for more details.

#### Can I use other frontend frameworks?

No, BWE is implemented by tying directly into the render pipeline of Preact. Discussions have occurred about
the feasibility of supporting other frameworks, but it would be a sizeable engineering effort.

You may be able to import component built in other frameworks if they can be bundled as Web Components

#### Can I use web components?

Yes, Preact supports embedding Web Components. See [components.md](components.md#web-components) for more details.

#### What about Shadow Realms?

Shadow Realms are a proposed browser standard which would offer some of the same benefits as BWE. Implementation
of Shadow Realms is still in the early stages and it is unclear when it will be available in all major browsers, and
whether it would be possible to use it in a way which is compatible with the BOS architecture. We will continue to
monitor the progress of Shadow Realms.

#### How do I optimize performance?

##### Trust Mode

The default trust model of BOS is to encourage risk-free composability by sandboxing all embedded BOS components by default.
There are cases where this might not be necessary, such as:
- embedding your own components
- embedding components from other developers you trust
- embedding components you have audited for malicious behavior and are locked to a specific version

If a component does not need to be sandboxed, you can chaing the `trust` mode on the embed and the component will be directly
executed in the same container instead of having a sandboxed iframe created for it. This can yield significant performance
improvements for pages which render many components (e.g. social feeds).

See [performance.md](performance.md#trust) for the syntax to change the trust mode of an embedded component

##### Best Practices

See [performance.md](performance.md#best-practices) for a general list of best practices for optimizing performance of BOS
components.

#### How do I interact with the external services?

You can directly call out to external services with the browser-native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
or any other request library, but keep in mind that external service integrations can diminish the decentralization benefits of BOS if
they are not decentralized themselves.

#### Can my code editor handle component syntax?

> TBD (we might provide a typescript definition package to help with this)

#### What happens whgen I set an `onClick` function and it gets called?

### Architecture

#### Why is isolation important? What are the attack vectors?

To achieve the high level of composability that is a central goal of BOS, developers must be able to embed components
from other authors without the burden of personally auditing the code for malicious behavior. This is especially true
if components are embedded dynamically and it is impossible for the dapp developer to know in advance which components
will be loaded (e.g. a social post feed which can render components inline).

Example attack
Bob develops a defi dapp which has a button to initiate a transaction to transfer some value (e.g. fungible tokens). He
then embeds a seemingly innocent BOS component from another author in his dapp— perhaps it is a UI component to render
a nice accordion element. In that accordion element is code which directly modifies the DOM of the previously mentioned
button, and causes it to present users with a transaction to transfer value to the malicious component author instead
of wherever it was supposed to go. A user goes to Bob's defi dapp and clicks the transfer button, but doesnt realize
the transaction they are confirming has been tampered with.

#### How are off-chain dependencies decentralized?

Packages are loaded via CDNs, and most CDNs have decentralization architecture built in. That being said, it is possible
for a CDN to go offline or be blocked in a particular region. In this case, the dependency will fail to load which may
cause the component to fail to render.

In the spirit of progressive decentralization, BWE will launch with dependencies being powered directly by CDN URLs. In
the future, we will explore the following:
- a package registry hosted on an inherently decentralized network (e.g. IPFS)
- creating CDN-agnostic import syntax where developers can specify the package and version they require then leave
resolution up to the gateway at runtime

#### Why is SocialDB integration not built in?

In keeping with our goal to be minimally different from vanilla (p)react, we have opted to have SocialDB integration be
provided as an external library instead of built into the engine.

#### How do cross-components function calls work?

> @andy (very high level summary then link to architecture doc)

#### What are the downsides of using iframes?

> @andy
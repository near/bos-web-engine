# Solution Architecture

## Overview

The VM prototype for BOS Web Engine works by executing Component source code in iframes, sandboxed to enforce isolation between Components as well as the application running in the outer window. At a high level:

- Component source code is fetched from on chain and transpiled from the current JSX to JavaScript (Preact)
- A new iframe is created to encapsulate the translated JavaScript in a closure used to render the Component inside the outer window application
- The Component props and DOM tree are serialized and posted to the outer window application to be rendered
- A parent Component rendering Component children renders a placeholder DOM node (a leaf on the parent Component’s DOM tree) and the outer window application renders a Component iframe container (with props) for each child
- Component iframe containers may expose methods to be invoked from the outer window application via message posting, either as event handlers or indirect callbacks originating from other Components proxied by the outer window application
- Components are re-rendered in response to callbacks in the outer window, and re-render their children in turn

The repository for the prototype can be found here: https://github.com/andy-haynes/wigesque, with the intention of moving this to a near repository once the team is satisfied that the approach is viable and the structure conducive to building upon.

## Module Loading

At a high level, module loading is as follows:

1. Fetch Component’s JSX source
2. Transpile into Preact
3. Render Component Preact component in iframe
   1. Serialize DOM subtree & props
   2. Build set of child Components to fetch, creating a unique identifier for each
   3. Post message to outer window
      1. Render serialized DOM subtree (including DOM placeholders for child Components) in outer window
      2. Initialize iframes for child Components (each one forking new workflow starting from #1)

The Component iframe containers are rendered once and persist until the page is refreshed. There is currently no way to detach or reset them.

Unique identifiers must be generated at render time for each Component (except the root Component, which is hardcoded) in order to be addressable by other Components and the outer window.

This approach enforces isolation between all Components by forcing them to render in their own iframe. This constraint can be relaxed on a per-Component basis during transpilation by grouping sets of “trusted” Components together in the same Component tree. Trusted Components would not be treated as leaf nodes in the DOM subtree, but instead inlined into the tree prior to being rendered. This functionality/optimization could be supported by the current architecture but must be well defined prior to implementation (e.g. if a parent Component renders a trusted child Component, are the children’s Components also trusted?)

There are likely optimizations to be incorporated into module loading, as the current approach of resolving child Components occurs at render time. Caching and eager fetching of Components may be viable options here.

The current implementation relies on server-side transpilation, but this ultimately should be happening on the client for efficiency and transparency. This decision to do this server-side was made to expedite development as there was some friction attempting to add babel transpilation to the outer window app.

> TODO: insert diagram

## Component Rendering

Rendering of Components is handled by Preact. The current implementation inlines a custom, minified Preact bundle into the iframe code directly, which has new logic in the render method to serialize the DOM tree and props before posting a message to the outer window to render Component. Subsequent renders are done manually at this point however, i.e. the Component iframe container calls render in response to messages posted from the parent window.

Once initialized, Component DOM can be interacted with in the outer window. Components are re-rendered in one of two ways:

- A callback is invoked on the Component (e.g. an onClick event handler)
- The Component’s parent Component is re-rendered

Executing a callback posts a message from the outer window to the corresponding Component’s iframe container. This message specifies the identifier for the Component’s method; upon processing the message the Component executes the method and manually calls the render method. Upon re-rendering, any child Components are also re-rendered. This naive approach can be refined by implementing a mechanism of determining whether:

- The execution of a callback constitutes a change in Component state that would necessitate re-rendering
- The re-render of a parent component produces a change in the props passed down to the child component (i.e. sort of a shouldComponentUpdate)

## Callbacks

Since message posting does not permit the passing of functions (among other things), functions are serialized in the Component iframe container and deserialized in the outer window before rendering. This “serialization” of functions is better described as a transformation however, as any callbacks invoked in the outer window DOM must be wrapped in a call to postMessage in order for the method to be executed in the Component iframe container. Within the Component iframe container, handling requests to invoke a method involves using a key from the message to look up the callback to be executed.

This implementation provides a functional, if limited, method for execution of callbacks across isolation boundaries, and currently supports:

- Components executing callbacks entirely contained within the Component
  - `<button onClick={() => State.update({ k: state.k + 1 })}>`
- Child Components executing callbacks passed by their parent
  - Parent passes a prop `onUpdate={() => State.update({ k: state.k + 1 })}` to its child
  - Child renders a button `<button onClick={props.onUpdate}>`
  - When the button is clicked on the child Component in the outer window, the `() => State.update({ k: state.k + 1 })` function executes in the parent Component iframe container
- Parent Components executing callback arguments to a method passed to the child Component
  - Parent passes a prop `executeChildMethod={(cb) => cb()}` to its child
  - Child invokes the prop callback `props.executeChildMethod(() => State.update({ k: state.k + 1 }))`
  - Parent executes the child callback, but only if the child callback is executed within the parent’s function (see below). **This appears to be the same level of support offered by the current Viewer however - it can execute the function argument from the child Component in the props function, but cannot defer it.**

Shortcomings/missing functionality from current callbacks implementation (WIP)

- Callbacks are implicitly treated as synchronous
- Dynamic methods for deferred execution of methods passed from children
- Support for arguments
- No data returned
- Brittle Component identifiers based on index position within set of parent’s children

## Message Posting (WIP)

- Components may only invoke the outer window’s postMessage method
- Outer window must specify the target iframe window’s postMessage method
- Need to determine viability/vulnerability of Components gleaning context on other Components
- Outer window can mitigate unauthorized inter-Component callbacks by verifying ancestry between method invoker and method executor
- Needs a more robust serialization implementation (https://github.com/ungap/structured-clone looks promising)

## Near Social VM Compatibility

This is the list of known compatibility issues with the current VM implementation. This list will grow as this work progresses and new discrepancies are found.

1. The current VM ignores undeclared references, providing undefined values for undeclared identifiers rather than throwing a ReferenceError (e.g. const y = x; where x is not in scope). Similarly it permits references to properties on undefined values, evaluating these expressions as undefined rather than throwing a TypeError (e.g. props.x.y where props.x is undefined). These would seem to indicate a lack of strict mode in the current VM, though other strict mode functionality appears to be supported. This would not be a trivial issue to address in transpilation or containerization of Component source code and instead should be handled by Component developers as part of migration to BWE.

## Upcoming Exploration Tasks

See https://pagodaplatform.atlassian.net/browse/ROAD-216 for a detailed, up-to-date breakdown of the following:

1. CSS Support | P0
   1. Components rely on the styled-components library to provide custom styles for rendered components.
   2. We need a way to send the style data to the Outer Window Application where they can be applied to the Component DOM.
   3. It looks like integrating styled-components into the Outer Window Application is the approach to try first. The hard part will be mapping the styled component to the serialized component.
   4. Outcome: Design Document [a]- Clarity on the approach we should take
2. Near transaction support (Outer Window Application) | P0
   1. Current implementation is fairly minimal.
   2. We need support for signing and key management to facilitate transaction signing requests.
   3. State management of Component iframe containers and the Component DOM is a little crude, we’ll likely want a more robust way of managing iframes and DOM eventually.
   4. Debugging and performance monitoring features (e.g. logs of message posting, displaying loading times) enables better DX.
   5. Outcome: Design Document [b]- Clarity on the approach we should take
3. Callback Support | P0
   1. Basic callback functionality is supported. [c][d][e][f]The Outer Window Application DOM transforms event callbacks to message posts to the target Component iframe container. Similarly, Components may invoke methods on other Components.
   2. We need to use the structured-clone NPM package to serialize DOM events. Currently only a subset of event properties are passed along.
   3. We need support for callback arguments in DOM event callbacks. Currently only the event is passed.
   4. Outcome: Design Document [g]- Clarity on the approach we should take
4. Near Social API | P0
   1. There is basic support for the current VM API (e.g. Social, Near) but it’s not in parity.
   2. We need the prototype implementation to be in parity with the current VM.
5. Component Iframe Container Identification | P0
   1. Generating unique Component IDs at render time can be done implicitly by using a concatenation of: 1. Component source path 2. Initial props value 3. Ancestral Component IDs
      This should only break in cases where two instances of the same Component are rendered under a single parent Component using the same props values. In these instances we would need the developer to explicitly delineate between the two with a special key on the Component’s props argument. This is analogous to React’s requirement for a key attribute on components, and conflicts could be identified to some extent when the Component source is saved. These explicit keys would still need to be appropriately namespaced to avoid collision
   2. Component identifiers are currently constructed from the Component source path and index within its set of parent Components, prefixed onto its parent’s (and ancestors’) identifiers. These identifiers persist the lifespan of the Component iframe container.
   3. We need a way to build Component identifiers which are not dependent on render position, as this can change as the result of a parent render. In the current implementation, Components must have a stable identifier when their parent renders them to ensure the Component iframe container and Outer Window Application DOM remain synchronized.
6. Trusted Component Loading | P1
   1. Currently Components are always loaded dynamically; the process responsible for creating React elements loads a placeholder for any Component leaf nodes in the current Component’s DOM subtree which gets rendered over when the child Component’s iframe container is loaded.
   2. We need a way to inline the descendant Component definitions into a parent Component source, trading dynamic loading for static.
   3. At a high level this involves creating Preact Components for each trusted descendant and prefixing it to the root Component’s transpiled source.
7. Move Component source transpilation client-side | P2
   1. The prototype fetches Component source via local REST API using babel (with preact plugins) to transpile the raw source.
   2. We need the transpilation to happen client-side for transparency.
   3. There were issues integrating client-side babel usage into a React app, which is why it’s currently server-side.
      —
      Do a performance benchmark, if bad:
8. Loading Optimizations | P2
   1. Dynamic loading of leaf nodes is not ideal, particularly for deep trees.
   2. Statically traversing the root Component’s dependency tree would flatten the dependency list and eliminate duplicates, enabling pre-fetching of Component source dependencies.
   3. A simple client-side cache would eliminate duplicate fetching, though it’s possible the browser will be performing some caching internally.
9. Component Rendering Optimizations | P2
   1. Components (and, recursively, their children) are currently re-rendered when anything changes.
   2. Caching props passed to rendered child Components would prevent unnecessary re-renders of children.
   3. Check state by value before and after mutation to prevent re-renders when nothing has changed.
   4. Exploration of deeper integration with Preact (or another VDOM library); render is manually called now as the props and state of Component is external to the Component.

## Future Application Architecture (WIP)

Currently the prototype works with the existing Near Social Components, i.e. a subset of JSX to be interpreted as a whole component, with the ultimate goal of hosting entire JS web applications. At a high level, this is a matter of bundling the application code for BWE compatibility before loading it into an iframe.

TBD:

- Are Applications and Components fundamentally incompatible concepts or is there some degree of interoperability? (e.g. can Applications import Components?)
- Can Applications take arguments at render time? (i.e. like how Components take props)
- Can Applications be nested?

Incompatibilities with current prototype:

- state and props are external to the Component source currently - the Component source makes reference to them and executes in a closure scope where they are defined. Consequently rendering is done when this state is mutated. Applications would be different in that they are managing their own state and rendering internally, as a black box into which the BWE context has no awareness. In the current model, Applications would need a way to notify the Outer Window Application of a new render. This could work with minimal integration for React Applications, where transpiling to Preact could provide a 1:1 with the render function, but other implementations would require a way to relay DOM changes.

## Diagrams

### DOM Callbacks

Component Source:

```jsx
// Component Source
State.init({ value: 0 });
return (
  <button onClick={(e) => State.update({ value: state.value + 1 })}>
    Click Me
  </button>
);
```

> TODO: insert diagram

1. Button is clicked in outer window application DOM
2. Target Component iframe’s window.postMessage method is invoked with callback metadata
3. Component iframe container handles the callback message and gets a reference to the target function
4. Target function defined in the Component source is executed
5. State.update method in the Component iframe container is invoked
6. A render message is posted to the outer window application
7. Outer window application replaces the DOM node for the target Component

### Component Callbacks

Component Source:

```jsx
// Parent Component Source
State.init({ value: 0 });
return (
  <Component
    src="example.near/widget/ChildComponent"
    props={{ onClick: (n) => State.update({ value: state.value + n }) }}
  />
);

// Child Component Source - example.near/widget/ChildComponent
return <button onClick={(e) => props.onClick(1)}>Click Me</button>;
```

> TODO: insert diagram

1. Button is clicked in the Child Component’s DOM subtree within the outer window application
2. Child Component iframe’s window.postMessage method is invoked with callback metadata
3. Child Component iframe container handles the callback message and gets a reference to the target function
4. Child Component iframe container calls props.onClick which, as a function passed in from the parent via props, was mapped to call window.parent.postMessage in the outer window application
5. The outer window application relays the callback metadata to the Parent Component iframe container
6. Parent Component iframe container handles the callback message and gets a reference to the target function
7. Target function defined in the Parent Component source is executed
8. State.update method in the Component iframe container is invoked
9. A render message is posted to the outer window application
10. Outer window application replaces the DOM node for the target Parent Component
11. Parent Component re-renders the Child Component DOM

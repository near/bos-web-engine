# Solution Architecture

## Overview

The VM prototype for BOS Web Engine works by executing Widget source code in iframes, sandboxed to enforce isolation between Widgets as well as the application running in the outer window. At a high level:

- Widget source code is fetched from on chain and transpiled from the current JSX to JavaScript (Preact)
- A new iframe is created to encapsulate the translated JavaScript in a closure used to render the Widget inside the outer window application
- The Widget props and DOM tree are serialized and posted to the outer window application to be rendered
- A parent Widget rendering Widget children renders a placeholder DOM node (a leaf on the parent Widget’s DOM tree) and the outer window application renders a Widget iframe container (with props) for each child
- Widget iframe containers may expose methods to be invoked from the outer window application via message posting, either as event handlers or indirect callbacks originating from other Widgets proxied by the outer window application
- Widgets are re-rendered in response to callbacks in the outer window, and re-render their children in turn

The repository for the prototype can be found here: https://github.com/andy-haynes/wigesque, with the intention of moving this to a near repository once the team is satisfied that the approach is viable and the structure conducive to building upon.

## Module Loading

At a high level, module loading is as follows:

1. Fetch Widget’s JSX source
2. Transpile into Preact
3. Render Widget Preact component in iframe
   1. Serialize DOM subtree & props
   2. Build set of child Widgets to fetch, creating a unique identifier for each
   3. Post message to outer window
      1. Render serialized DOM subtree (including DOM placeholders for child Widgets) in outer window
      2. Initialize iframes for child Widgets (each one forking new workflow starting from #1)

The Widget iframe containers are rendered once and persist until the page is refreshed. There is currently no way to detach or reset them.

Unique identifiers must be generated at render time for each Widget (except the root Widget, which is hardcoded) in order to be addressable by other Widgets and the outer window.

This approach enforces isolation between all Widgets by forcing them to render in their own iframe. This constraint can be relaxed on a per-Widget basis during transpilation by grouping sets of “trusted” Widgets together in the same Widget tree. Trusted Widgets would not be treated as leaf nodes in the DOM subtree, but instead inlined into the tree prior to being rendered. This functionality/optimization could be supported by the current architecture but must be well defined prior to implementation (e.g. if a parent Widget renders a trusted child Widget, are the children’s Widgets also trusted?)

There are likely optimizations to be incorporated into module loading, as the current approach of resolving child Widgets occurs at render time. Caching and eager fetching of Widgets may be viable options here.

The current implementation relies on server-side transpilation, but this ultimately should be happening on the client for efficiency and transparency. This decision to do this server-side was made to expedite development as there was some friction attempting to add babel transpilation to the outer window app.

> TODO: insert diagram

## Widget Rendering

Rendering of Widget Components is handled by Preact. The current implementation inlines a custom, minified Preact bundle into the iframe code directly, which has new logic in the render method to serialize the DOM tree and props before posting a message to the outer window to render Widget. Subsequent renders are done manually at this point however, i.e. the Widget iframe container calls render in response to messages posted from the parent window.

Once initialized, Widget DOM can be interacted with in the outer window. Widgets are re-rendered in one of two ways:

- A callback is invoked on the Widget (e.g. an onClick event handler)
- The Widget’s parent Widget is re-rendered

Executing a callback posts a message from the outer window to the corresponding Widget’s iframe container. This message specifies the identifier for the Widget’s method; upon processing the message the Widget executes the method and manually calls the render method. Upon re-rendering, any child Widgets are also re-rendered. This naive approach can be refined by implementing a mechanism of determining whether:

- The execution of a callback constitutes a change in Widget state that would necessitate re-rendering
- The re-render of a parent component produces a change in the props passed down to the child component (i.e. sort of a shouldComponentUpdate)

## Callbacks

Since message posting does not permit the passing of functions (among other things), functions are serialized in the Widget iframe container and deserialized in the outer window before rendering. This “serialization” of functions is better described as a transformation however, as any callbacks invoked in the outer window DOM must be wrapped in a call to postMessage in order for the method to be executed in the Widget iframe container. Within the Widget iframe container, handling requests to invoke a method involves using a key from the message to look up the callback to be executed.

This implementation provides a functional, if limited, method for execution of callbacks across isolation boundaries, and currently supports:

- Widgets executing callbacks entirely contained within the Widget
  - `<button onClick={() => State.update({ k: state.k + 1 })}>`
- Child Widgets executing callbacks passed by their parent
  - Parent passes a prop `onUpdate={() => State.update({ k: state.k + 1 })}` to its child
  - Child renders a button `<button onClick={props.onUpdate}>`
  - When the button is clicked on the child Widget in the outer window, the `() => State.update({ k: state.k + 1 })` function executes in the parent Widget iframe container
- Parent Widgets executing callback arguments to a method passed to the child Widget
  - Parent passes a prop `executeChildMethod={(cb) => cb()}` to its child
  - Child invokes the prop callback `props.executeChildMethod(() => State.update({ k: state.k + 1 }))`
  - Parent executes the child callback, but only if the child callback is executed within the parent’s function (see below). **This appears to be the same level of support offered by the current Viewer however - it can execute the function argument from the child Widget in the props function, but cannot defer it. See [andyh.near/widget/RenderTestChild](https://near.social/#/mob.near/widget/WidgetSource?src=andyh.near/widget/RenderTestChild).**

Shortcomings/missing functionality from current callbacks implementation (WIP)

- Callbacks are implicitly treated as synchronous
- Dynamic methods for deferred execution of methods passed from children
- Support for arguments
- No data returned
- Brittle Widget identifiers based on index position within set of parent’s children

## Message Posting (WIP)

- Widgets may only invoke the outer window’s postMessage method
- Outer window must specify the target iframe window’s postMessage method
- Need to determine viability/vulnerability of Widgets gleaning context on other Widgets
- Outer window can mitigate unauthorized inter-Widget callbacks by verifying ancestry between method invoker and method executor
- Needs a more robust serialization implementation (https://github.com/ungap/structured-clone looks promising)

## Near Social VM Compatibility

This is the list of known compatibility issues with the current VM implementation. This list will grow as this work progresses and new discrepancies are found.

1. The current VM ignores undeclared references, providing undefined values for undeclared identifiers rather than throwing a ReferenceError (e.g. const y = x; where x is not in scope). Similarly it permits references to properties on undefined values, evaluating these expressions as undefined rather than throwing a TypeError (e.g. props.x.y where props.x is undefined). These would seem to indicate a lack of strict mode in the current VM, though other strict mode functionality appears to be supported. This would not be a trivial issue to address in transpilation or containerization of Widget source code and instead should be handled by Widget developers as part of migration to BWE.

## Upcoming Exploration Tasks

See https://pagodaplatform.atlassian.net/browse/ROAD-216 for a detailed, up-to-date breakdown of the following:

1. CSS Support | P0
   1. Widgets rely on the styled-components library to provide custom styles for rendered components.
   2. We need a way to send the style data to the Outer Window Application where they can be applied to the Widget DOM.
   3. It looks like integrating styled-components into the Outer Window Application is the approach to try first. The hard part will be mapping the styled component to the serialized component.
   4. Outcome: Design Document [a]- Clarity on the approach we should take
2. Near transaction support (Outer Window Application) | P0
   1. Current implementation is fairly minimal.
   2. We need support for signing and key management to facilitate transaction signing requests.
   3. State management of Widget iframe containers and the Widget DOM is a little crude, we’ll likely want a more robust way of managing iframes and DOM eventually.
   4. Debugging and performance monitoring features (e.g. logs of message posting, displaying loading times) enables better DX.
   5. Outcome: Design Document [b]- Clarity on the approach we should take
3. Callback Support | P0
   1. Basic callback functionality is supported. [c][d][e][f]The Outer Window Application DOM transforms event callbacks to message posts to the target Widget iframe container. Similarly, Widgets may invoke methods on other Widgets.
   2. We need to use the structured-clone NPM package to serialize DOM events. Currently only a subset of event properties are passed along.
   3. We need support for callback arguments in DOM event callbacks. Currently only the event is passed.
   4. Outcome: Design Document [g]- Clarity on the approach we should take
4. Near Social API | P0
   1. There is basic support for the current VM API (e.g. Social, Near) but it’s not in parity.
   2. We need the prototype implementation to be in parity with the current VM.
5. Widget Iframe Container Identification | P0
   1. Generating unique Widget IDs at render time can be done implicitly by using a concatenation of: 1. Widget source path 2. Initial props value 3. Ancestral Widget IDs
      This should only break in cases where two instances of the same Widget are rendered under a single parent Widget using the same props values. In these instances we would need the developer to explicitly delineate between the two with a special key on the Widget’s props argument. This is analogous to React’s requirement for a key attribute on components, and conflicts could be identified to some extent when the Widget source is saved. These explicit keys would still need to be appropriately namespaced to avoid collision
   2. Widget identifiers are currently constructed from the Widget source path and index within its set of parent Widgets, prefixed onto its parent’s (and ancestors’) identifiers. These identifiers persist the lifespan of the Widget iframe container.
   3. We need a way to build Widget identifiers which are not dependent on render position, as this can change as the result of a parent render. In the current implementation, Widgets must have a stable identifier when their parent renders them to ensure the Widget iframe container and Outer Window Application DOM remain synchronized.
6. Trusted Widget Loading | P1
   1. Currently Widgets are always loaded dynamically; the process responsible for creating React elements loads a placeholder for any Widget leaf nodes in the current Widget’s DOM subtree which gets rendered over when the child Widget’s iframe container is loaded.
   2. We need a way to inline the descendant Widget definitions into a parent Widget source, trading dynamic loading for static.
   3. At a high level this involves creating Preact Components for each trusted descendant and prefixing it to the root Widget’s transpiled source.
7. Move Widget source transpilation client-side | P2
   1. The prototype fetches Widget source via local REST API using babel (with preact plugins) to transpile the raw source.
   2. We need the transpilation to happen client-side for transparency.
   3. There were issues integrating client-side babel usage into a React app, which is why it’s currently server-side.
      —
      Do a performance benchmark, if bad:
8. Loading Optimizations | P2
   1. Dynamic loading of leaf nodes is not ideal, particularly for deep trees.
   2. Statically traversing the root Widget’s dependency tree would flatten the dependency list and eliminate duplicates, enabling pre-fetching of Widget source dependencies.
   3. A simple client-side cache would eliminate duplicate fetching, though it’s possible the browser will be performing some caching internally.
9. Widget Rendering Optimizations | P2
   1. Widgets (and, recursively, their children) are currently re-rendered when anything changes.
   2. Caching props passed to rendered child Widgets would prevent unnecessary re-renders of children.
   3. Check state by value before and after mutation to prevent re-renders when nothing has changed.
   4. Exploration of deeper integration with Preact (or another VDOM library); render is manually called now as the props and state of Widget components is external to the component.

## Future Application Architecture (WIP)

Currently the prototype works with the existing Near Social Widgets, i.e. a subset of JSX to be interpreted as a whole component, with the ultimate goal of hosting entire JS web applications. At a high level, this is a matter of bundling the application code for BWE compatibility before loading it into an iframe.

TBD:

- Are Applications and Widgets fundamentally incompatible concepts or is there some degree of interoperability? (e.g. can Applications import Widgets?)
- Can Applications take arguments at render time? (i.e. like how Widgets take props)
- Can Applications be nested?

Incompatibilities with current prototype:

- state and props are external to the Widget source currently - the Widget source makes reference to them and executes in a closure scope where they are defined. Consequently rendering is done when this state is mutated. Applications would be different in that they are managing their own state and rendering internally, as a black box into which the BWE context has no awareness. In the current model, Applications would need a way to notify the Outer Window Application of a new render. This could work with minimal integration for React Applications, where transpiling to Preact could provide a 1:1 with the render function, but other implementations would require a way to relay DOM changes.

## Diagrams

### DOM Callbacks

Widget Source:

```jsx
// Widget Source
State.init({ value: 0 });
return (
  <button onClick={(e) => State.update({ value: state.value + 1 })}>
    Click Me
  </button>
);
```

> TODO: insert diagram

1. Button is clicked in outer window application DOM
2. Target Widget iframe’s window.postMessage method is invoked with callback metadata
3. Widget iframe container handles the callback message and gets a reference to the target function
4. Target function defined in the Widget source is executed
5. State.update method in the Widget iframe container is invoked
6. A render message is posted to the outer window application
7. Outer window application replaces the DOM node for the target Widget

### Widget Callbacks

Widget Source:

```jsx
// Parent Widget Source
State.init({ value: 0 });
return (
  <Widget
    src="example.near/widget/ChildWidget"
    props={{ onClick: (n) => State.update({ value: state.value + n }) }}
  />
);

// Child Widget Source - example.near/widget/ChildWidget
return <button onClick={(e) => props.onClick(1)}>Click Me</button>;
```

> TODO: insert diagram

1. Button is clicked in the Child Widget’s DOM subtree within the outer window application
2. Child Widget iframe’s window.postMessage method is invoked with callback metadata
3. Child Widget iframe container handles the callback message and gets a reference to the target function
4. Child Widget iframe container calls props.onClick which, as a function passed in from the parent via props, was mapped to call window.parent.postMessage in the outer window application
5. The outer window application relays the callback metadata to the Parent Widget iframe container
6. Parent Widget iframe container handles the callback message and gets a reference to the target function
7. Target function defined in the Parent Widget source is executed
8. State.update method in the Widget iframe container is invoked
9. A render message is posted to the outer window application
10. Outer window application replaces the DOM node for the target Parent Widget
11. Parent Widget re-renders the Child Widget DOM

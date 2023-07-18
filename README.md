# BOS Web Engine R&D

The BOS Web Engine is an experimental runtime/rendering layer aimed at replacing the Discovery VM with a full-featured React(or Preact) environment which would enable access to the greater web ecosystem including NPM dependencies. It is an R&D effort lead by Pagoda and will be considered for production usage upon meeting the following criteria:

- [ ] parity with existing VM (w/ exception of embedding iframes)
- [ ] supports npm dependencies
- [ ] performant on TBD % of mobile devices
- [ ] enables embedded wallet functionality

Further goals:

- [ ] TypeScript support
- [ ] Full web API support (canvas, etc)
- [ ] Cross-component global state management


## Proposed Solution

The VM prototype for BOS Web Engine works by executing Component source code in iframes, sandboxed to enforce isolation between Components as well as the application running in the outer window. At a high level:
- Component source code is fetched from on chain and transpiled from the current JSX to JavaScript (Preact)
- A new iframe is created to encapsulate the translated JavaScript in a closure used to render the Component inside the outer window application
- The Component props and DOM tree are serialized and posted to the outer window application to be rendered
- A parent Component rendering Component children renders a placeholder DOM node (a leaf on the parent Component’s DOM tree) and the outer window application renders a Component iframe container (with props) for each child
- Component iframe containers may expose methods to be invoked from the outer window application via message posting, either as event handlers or indirect callbacks originating from other Components proxied by the outer window application
- Components are re-rendered in response to callbacks in the outer window, and re-render their children in turn


### Challenges
- [ ] controlled components
- [ ] secure inter-component communication & function execution
- [ ] decentralization of dependencies hosting
- [ ] performance of pages with large number of components
- [ ] maintainability of logic for sanitization of component output

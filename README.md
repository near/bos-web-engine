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

The VM prototype for BOS Web Engine works by executing Component source code in iframes, sandboxed to enforce isolation between Components as well as the application running in the outer window.

See [architecture.md](./architecture.md) for full details

### Challenges
- [ ] controlled components
- [ ] secure inter-component communication & function execution
- [ ] decentralization of dependencies hosting
- [ ] performance of pages with large number of components
- [ ] maintainability of logic for sanitization of component output

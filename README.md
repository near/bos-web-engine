# BOS Web Engine R&D

The BOS Web Engine is an experimental runtime/rendering layer aimed at replacing the Discovery VM with a full-featured React(or Preact) environment which would enable access to the greater web ecosystem including NPM dependencies. It is an R&D effort lead by Pagoda and will be considered for production usage once it surpasses the existing VM capabilities.

Some core goals:
- [ ] support npm dependencies
- [ ] component code is minimally different from vanilla React
- [ ] isolation of component execution leverages browser sandboxing (iframes)
- [ ] configurable trust model to tune performance when embedded components have been vetted

Further goals:
- [ ] TypeScript support
- [ ] Full web API support (canvas, etc)
- [ ] Cross-component global state management

For a more detailed breakdown of the work, see the issues section.

## Proposed Solution

The prototype for BOS Web Engine works by executing Component source code in iframes, sandboxed to enforce isolation between Components as well as the application running in the outer window.

See [architecture.md](./architecture.md) for full details

### Challenges
- [ ] controlled components
- [ ] secure inter-component communication & function execution
- [ ] decentralization of dependencies hosting
- [ ] performance of pages with large number of components
- [ ] maintainability of logic for sanitization of component output

### Discussion
This project leverages [GitHub Discussions](https://github.com/near/bos-web-engine/discussions) for decision making, Q&A, implementation discussion between contributors, and more. 

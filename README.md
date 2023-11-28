# BOS Web Engine R&D

The BOS Web Engine (BWE) is an experimental runtime/rendering layer aimed at replacing the Discovery VM with a full-featured React(or Preact) environment which would enable access to the greater web ecosystem including NPM dependencies. It is an R&D effort lead by Pagoda and will be considered for production usage once our GitHub issues tagged as `P0 - Release Requirement` are completed.

> Note: developers who have created components on the Discovery VM should expect a reasonable migration effort to make their components compatible with BWE once it launches. See _"Will BWE be backwards compatible with existing VM components?"_ in the [FAQ](#FAQ) section for more info

Some core goals:
- ability to import npm packages
- component code is minimally different from vanilla React
- isolation of component execution leverages browser sandboxing (iframes)
- configurable trust model to tune performance when embedded components are known to be safe

Examples of other impactful features we plan to research:
- TypeScript support
- Full web API support (canvas, etc)
- Cross-component global state management

For a more detailed breakdown of the work, see [issues labeled with `Epic`](https://github.com/near/bos-web-engine/issues?q=is:open+is:issue+label:Epic)

## Solution Architecture

BWE works by executing Component source code in hidden iframes, sandboxed to enforce isolation between Components as well as the application running in the outer window. Those iframes emit render events with the DOM produced, which is then displayed on the page by the outer window application

See [architecture.md](./architecture.md) for more details

### Writing Components
See [components.md](./components.md) for details on the syntax and patterns necessary for writing BWE compatible components

## Discussion
This project leverages [GitHub Discussions](https://github.com/near/bos-web-engine/discussions) for decision making, Q&A, implementation discussion between contributors, and more. 

## FAQ

### When will BWE be production ready?

At this point, we are focused on communicating progress and do not have an estimate on a date when BWE will be production ready. Updates will be posted to BOS social feeds from the Pagoda account.

### Will BWE be backwards compatible with existing VM components?

No. BWE is a complete re-write of the component runtime and will not be backwards compatible with existing components due to significant architectural differences. Components will be similar in many ways since they are already written with JSX, but BWE code will look much more like vanilla React with some additional patterns on top.

Our primary goal is to build the most capable engine to support complex dapps for a vibrant BOS ecosystem, then we will make efforts to ease the migration of existing work as much as possible. There will be ample discussion before any decisions are made on when and how to start switching to BWE once it is ready.

### Can existing React codebases be used with BWE?

While the process to convert an existing React codebase to run on BWE will be significantly easier than the previous VM, there will still be some syntax and architecture changes which must be handled manually.


# BOS Web Engine R&D

BOS Web Engine (BWE) is an experimental framework aimed at replacing the NEAR BOS VM with a full-featured React(or Preact) environment which would enable access to the greater web ecosystem including NPM dependencies. It is an R&D effort lead by Pagoda and will be considered for production usage once our GitHub [issues tagged as `P0 - Release requirement`](https://github.com/near/bos-web-engine/issues?q=is:open+is:issue+label:%22P0+-+Release+requirement%22) are completed.

**Developers who have created components on BOS should expect a reasonable migration effort to make their components compatible with BWE once it launches. See _"Will BWE be backwards compatible with existing VM components?"_ in the [FAQ](#FAQ) section for more info**

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

## More Info

See our [docs](https://roc-docs.near.dev)!

## FAQ

### Will BWE be backwards compatible with existing BOS components?

No. BWE is a complete re-write of the component runtime and will not be backwards compatible with existing components due to significant architectural differences. Components will be similar in many ways since they are already written with JSX, but BWE code will look much more like vanilla React with some additional patterns on top.

Our primary goal is to build the most capable engine to support complex dapps for a vibrant ecosystem, then we will make efforts to ease the migration of existing work as much as possible. There will be ample discussion before any decisions are made on when and how to start switching to BWE once it is ready.

### Can existing React codebases be used with BOS Web Engine?

While the process to convert an existing React codebase to run on BWE will be significantly easier than the BOS, there will still be some syntax and architecture changes which must be handled manually.

### Other Questions
See our full FAQ [here](https://roc-docs.near.dev/alpha/FAQ)

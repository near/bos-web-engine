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

### What code can I import?

### What are the downsides of using iframes?

### Can I use animation libraries?

### When will the previous VM stop being supported?

### What are the differences from vanilla (p)react?

### How do I convert an existing (p)react application?

### What are the performance limits? How many sandboxed components can reasonable be rendered on a page?

### Are browser APIs like Canves supported?

### Can I use other frontend frameworks?

### Can I use web components?

### What about Shadow Realms?

### Why is isolation important? What are the attack vectors?

### How do cross-components function calls work?

### How do I optimize performance?

### How are off-chain dependencies decentralized?

### How do I interact with the external services?

### Why is SocialDB integration not built in?

### Can my code editor handle component syntax?

### What happens whgen I set an `onClick` function and it gets called?

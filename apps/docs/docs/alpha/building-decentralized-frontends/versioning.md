---
sidebar_position: 4
---

# Versioning

:::warning Not Yet Available
Versioning is currently being worked on by the RoC team and is not yet available for use. **Current behavior is that the latest version of a component is always used.**
:::

RoC Components will support versioning based on blockheight at which changes were published. This resembles commits in a git repository.

Default behavior will be to use the latest version of a component **at the time of publish of the parent component**. It will be possible to specify that the current latest version of an embedded component should be loaded instead.

<details>
  <summary>Why change the default behavior from BOS components?</summary>
  <p>Locking embedded components to their state at time of publish will lead to more predictable frontend behavior across the ecosystem. We have often seen broken UI as a result of component authors not locking their embeds to a specific version and the embedded component changing in functionality or presentation.</p>
</details>
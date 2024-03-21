# Tabs

Implemented via Radix primitives: https://www.radix-ui.com/docs/primitives/components/tabs

## Example

```tsx
import { Tabs } from '@bos-web-engine/ui';

...

<Tabs.Root defaultValue="alerts">
  <Tabs.List>
    <Tabs.Trigger value="alerts">Alerts</Tabs.Trigger>
    <Tabs.Trigger value="history">History</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="alerts">
    ...
  </Tabs.Content>

  <Tabs.Content value="history">
    ...
  </Tabs.Content>
</Tabs.Root>
```

<!-- ! not yet supported
## Inline

You can use this alternative tab styling via the `inline` prop on the `Tabs.List` component:

```tsx
<Tabs.Root>
  <Tabs.List inline>...</Tabs.List>
  ...
</Tabs.Root>
```

## Routing

Sometimes it will make sense to sync the selected tab with the URL - each trigger acting as a link. This can be accomplished by using `useRouterParam()` and the `href` prop on each trigger:

```tsx
import { useRouteParam } from '@/hooks/route';

...

const activeTab = useRouteParam('tab', '?tab=section-1', true);

...

<Tabs.Root value={activeTab || ''}>
  <Tabs.List>
    <Tabs.Trigger value="section-1" href="?tab=section-1">Section 1</Tabs.Trigger>
    <Tabs.Trigger value="section-2" href="?tab=section-2">Section 2</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="section-1">...</Tabs.Content>
  <Tabs.Content value="section-2">...</Tabs.Content>
</Tabs.Root>;
```
-->
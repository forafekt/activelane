# @activelane/icons

A small Vue-native Iconify boundary for ActiveLane. Callers select icons explicitly with a namespace-qualified reference; this package does not maintain semantic names or aliases.

```vue
<script setup lang="ts">
import { getIcon } from '@activelane/icons'

const Search = getIcon('lucide.search')
const Settings = getIcon('lucide.settings')
</script>

<template>
  <Search class="size-4" />
  <Settings :size="18" aria-label="Settings" />
</template>
```

The public syntax is `namespace.icon`. `getIcon()` validates it and converts the first dot to Iconify's `namespace:icon` form. Malformed references throw immediately; there is no implicit default namespace.

Repeated calls with the same reference return the same cached Vue component. Components inherit `currentColor`, forward normal attributes, accept a `size` prop, and are decorative unless labelled with `aria-label` or `aria-labelledby`.

## Offline and dynamic icons

The Lucide Iconify collection is registered locally because it supplies ActiveLane's standard Workbench UI. Those icons render without network access. Other explicit namespaces, such as `mdi.database` or `simple-icons.github`, use Iconify's loader and cache. Missing icons render a local `lucide.circle-slash` fallback and warn without crashing the Workbench.

Extension contributions use the same canonical representation:

```ts
const contribution = {
  icon: 'lucide.database',
}
```

The resolver already accepts an `activelane.*` namespace. A future custom collection can be registered with Iconify without changing the public reference format.

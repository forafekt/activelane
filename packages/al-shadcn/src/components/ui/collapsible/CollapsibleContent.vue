<script setup lang="ts">
import type { CollapsibleContentProps } from 'reka-ui'
import { CollapsibleContent } from 'reka-ui'

defineOptions({
  name: 'CollapsibleContent',
})

const props = defineProps<CollapsibleContentProps>()
</script>

<template>
  <CollapsibleContent data-slot="collapsible-content" v-bind="props" class="collapsible-content">
    <slot />
  </CollapsibleContent>
</template>
<style scoped>
.collapsible-content {
  display: block;
}
</style>

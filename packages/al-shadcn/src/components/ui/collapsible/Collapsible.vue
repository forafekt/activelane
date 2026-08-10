<script setup lang="ts">
import type { CollapsibleRootEmits, CollapsibleRootProps } from 'reka-ui'
import { CollapsibleRoot, useForwardPropsEmits } from 'reka-ui'

defineOptions({
  name: 'Collapsible',
})

const props = defineProps<CollapsibleRootProps>()
const emits = defineEmits<CollapsibleRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CollapsibleRoot
    v-slot="slotProps"
    data-slot="collapsible"
    v-bind="forwarded"
    class="collapsible"
  >
    <slot v-bind="slotProps" />
  </CollapsibleRoot>
</template>

<style scoped>
.collapsible {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.collapsible > :first-child {
  margin-top: 0;
}
</style>

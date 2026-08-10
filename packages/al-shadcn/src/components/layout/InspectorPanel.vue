<script setup lang="ts">
import { cn } from '../../lib/utils'
import ScrollArea from '../overlays/ScrollArea.vue'
import PanelHeader from './PanelHeader.vue'

defineOptions({ name: 'AlInspectorPanel' })

defineProps<{ title?: string; class?: string }>()
</script>

<template>
  <aside
    :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-surface-1', $props.class)"
  >
    <PanelHeader :title="title">
      <template v-if="$slots.actions" #actions> <slot name="actions" /> </template>
    </PanelHeader>
    <ScrollArea> <slot /> </ScrollArea>
  </aside>
</template>

<script setup lang="ts">
import { cn } from '@activelane/shadcn'
import type { WorkbenchRuntimeApi } from '../../../core/runtime/types'
import PanelHeader from './PanelHeader.vue'

defineOptions({ name: 'InspectorPanel' })

const props = defineProps<{ runtime: WorkbenchRuntimeApi; title?: string; class?: string }>()

const [ScrollArea] = props.runtime.workbench.ui.getComponents(['ScrollArea'])
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

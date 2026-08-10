<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlWorkspaceShell' })

defineProps<{
  inspectorOpen?: boolean
  inspectorWidth?: string
  class?: string
}>()
</script>

<template>
  <section
    :class="cn('grid h-full min-h-0 min-w-0 bg-background', inspectorOpen ? 'grid-cols-[minmax(0,1fr)_var(--al-inspector-width,20rem)]' : 'grid-cols-[minmax(0,1fr)]', $props.class)"
    :style="{ '--al-inspector-width': inspectorWidth ?? '20rem' }"
  >
    <main class="min-h-0 min-w-0 overflow-hidden"><slot /></main>
    <aside v-if="inspectorOpen" class="min-h-0 overflow-hidden border-l border-border bg-surface-1">
      <slot name="inspector" />
    </aside>
  </section>
</template>

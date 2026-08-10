<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlSidepanelShell' })

defineProps<{
  activePane?: 'list' | 'detail'
  wide?: boolean
  class?: string
}>()
</script>

<template>
  <section
    :class="
      cn(
        'grid h-dvh min-h-0 min-w-0 overflow-hidden bg-background text-foreground',
        wide ? 'grid-cols-[minmax(17rem,0.92fr)_minmax(0,1.08fr)]' : 'grid-cols-1',
        $props.class,
      )
    "
  >
    <aside
      v-show="wide || activePane !== 'detail'"
      class="min-h-0 min-w-0 overflow-hidden border-r border-border bg-surface-1"
    >
      <slot name="list" />
    </aside>
    <main
      v-show="wide || activePane === 'detail'"
      class="min-h-0 min-w-0 overflow-hidden bg-background"
    >
      <slot name="detail" />
    </main>
  </section>
</template>

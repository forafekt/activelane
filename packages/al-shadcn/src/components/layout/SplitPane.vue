<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlSplitPane' })

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    primarySize?: string
    class?: string
  }>(),
  {
    direction: 'horizontal',
    primarySize: '20rem',
  },
)

const style = computed(() =>
  props.direction === 'horizontal'
    ? { gridTemplateColumns: `${props.primarySize} minmax(0,1fr)` }
    : { gridTemplateRows: `${props.primarySize} minmax(0,1fr)` },
)
</script>

<template>
  <section :class="cn('grid h-full min-h-0 min-w-0 overflow-hidden', $props.class)" :style="style">
    <div class="min-h-0 min-w-0 overflow-hidden"><slot name="primary" /></div>
    <div
      :class="
        cn(
          'bg-border',
          direction === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        )
      "
      aria-hidden="true"
    />
    <div class="min-h-0 min-w-0 overflow-hidden"><slot name="secondary" /></div>
  </section>
</template>

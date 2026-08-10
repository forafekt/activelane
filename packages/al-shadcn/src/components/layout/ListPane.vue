<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlListPane' })

defineProps<{
  bodyClass?: string
  class?: string
}>()
</script>

<template>
  <aside
    :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-surface-1', $props.class)"
  >
    <slot name="header" />
    <div :class="cn('min-h-0 overflow-auto', bodyClass)"><slot /></div>
  </aside>
</template>

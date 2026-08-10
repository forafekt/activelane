<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlDetailPane' })

defineProps<{
  bodyClass?: string
  class?: string
}>()
</script>

<template>
  <main
    :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background', $props.class)"
  >
    <slot name="header" />
    <div :class="cn('min-h-0 overflow-auto', bodyClass)"><slot /></div>
  </main>
</template>

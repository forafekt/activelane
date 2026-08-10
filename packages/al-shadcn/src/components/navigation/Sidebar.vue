<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlSidebar' })

defineProps<{
  title?: string
  class?: string
}>()
</script>

<template>
  <nav
    :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-1', $props.class)"
  >
    <header v-if="title || $slots.header" class="border-b border-border px-3 py-3">
      <slot name="header">
        <h2 class="m-0 text-sm font-semibold tracking-tight">{{ title }}</h2>
      </slot>
    </header>
    <div class="min-h-0 overflow-auto p-2"><slot /></div>
    <footer v-if="$slots.footer" class="border-t border-border p-2"><slot name="footer" /></footer>
  </nav>
</template>

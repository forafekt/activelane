<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlFilterBar' })

defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="cn('flex min-w-0 flex-wrap items-center gap-2 border-b border-border bg-surface-1 px-3 py-2', $props.class)"
  >
    <slot />
  </div>
</template>

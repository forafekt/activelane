<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlToolbar' })

defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="cn('flex min-h-9 flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-1 p-1', $props.class)"
    role="toolbar"
  >
    <slot />
  </div>
</template>

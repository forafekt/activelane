<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlMetadataRow' })

defineProps<{
  label: string
  value?: string | number | null
  class?: string
}>()
</script>

<template>
  <div
    :class="cn('grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-2 py-1 text-xs', $props.class)"
  >
    <div class="text-muted-foreground">{{ label }}</div>
    <div class="min-w-0 truncate text-foreground"><slot>{{ value ?? '—' }}</slot></div>
  </div>
</template>

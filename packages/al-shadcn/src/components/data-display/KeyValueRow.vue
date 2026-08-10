<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlKeyValueRow' })

defineProps<{
  label: string
  value?: string | number | null
  class?: string
}>()
</script>

<template>
  <div :class="cn('grid grid-cols-[7rem_minmax(0,1fr)] gap-2 py-1 text-xs', $props.class)">
    <dt class="text-muted-foreground">{{ label }}</dt>
    <dd class="m-0 min-w-0 truncate text-foreground"><slot>{{ value ?? '—' }}</slot></dd>
  </div>
</template>

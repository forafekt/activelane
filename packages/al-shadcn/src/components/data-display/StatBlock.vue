<script setup lang="ts">
import { cn } from '../../lib/utils'
import Badge from '../ui/Badge.vue'

defineOptions({ name: 'StatBlock' })

defineProps<{
  label: string
  value: string | number
  delta?: string
  class?: string
}>()
</script>

<template>
  <div :class="cn('rounded-lg border border-border bg-card p-3 shadow-sm', $props.class)">
    <div class="text-xs font-medium text-muted-foreground">{{ label }}</div>
    <div class="mt-1 flex items-end justify-between gap-2">
      <div class="text-2xl font-semibold tracking-tight">{{ value }}</div>
      <Badge v-if="delta" variant="outline">{{ delta }}</Badge>
    </div>
  </div>
</template>

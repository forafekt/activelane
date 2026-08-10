<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlInlineFormRow' })

defineProps<{
  label?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <div
    :class="cn('flex min-h-10 items-center justify-between gap-4 rounded-md py-2', $props.class)"
  >
    <div class="min-w-0">
      <div v-if="label" class="truncate text-sm font-medium">{{ label }}</div>
      <div v-if="description" class="text-xs leading-relaxed text-muted-foreground">
        {{ description }}
      </div>
    </div>
    <div class="shrink-0"><slot /></div>
  </div>
</template>

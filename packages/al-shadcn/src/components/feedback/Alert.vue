<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'Alert' })

withDefaults(
  defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'destructive'
    tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'error' | 'info'
    title?: string
    class?: string
  }>(),
  {
    variant: 'default',
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border p-3 text-sm',
        variant === 'default' &&
          (!tone || tone === 'neutral' || tone === 'info' || tone === 'primary') &&
          'border-border bg-card text-card-foreground',
        (variant === 'success' || tone === 'success') && 'border-success/30 bg-success/10 text-foreground',
        (variant === 'warning' || tone === 'warning') && 'border-warning/40 bg-warning/15 text-foreground',
        (variant === 'destructive' || tone === 'destructive' || tone === 'error') &&
          'border-destructive/30 bg-destructive/10 text-foreground',
        $props.class,
      )
    "
    role="status"
  >
    <div v-if="title" class="font-medium">{{ title }}</div>
    <div class="text-muted-foreground" :class="title && 'mt-1'"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlDashboardSplit' })

withDefaults(
  defineProps<{
    variant?: 'balanced' | 'detail-heavy' | 'sidebar' | 'aside-content'
    class?: string
  }>(),
  {
    variant: 'balanced',
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'grid gap-4',
        variant === 'balanced' && 'lg:grid-cols-2',
        variant === 'detail-heavy' && 'lg:grid-cols-[0.8fr_1.2fr]',
        variant === 'sidebar' && 'lg:grid-cols-[18rem_minmax(0,1fr)]',
        variant === 'aside-content' && 'lg:grid-cols-[minmax(0,1fr)_22rem]',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>

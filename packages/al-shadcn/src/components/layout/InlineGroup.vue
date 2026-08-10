<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlInlineGroup' })

withDefaults(
  defineProps<{
    gap?: 'xs' | 'sm' | 'md' | 'lg'
    wrap?: boolean
    class?: string
  }>(),
  {
    gap: 'sm',
    wrap: true,
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center',
        wrap && 'flex-wrap',
        gap === 'xs' && 'gap-1',
        gap === 'sm' && 'gap-2',
        gap === 'md' && 'gap-3',
        gap === 'lg' && 'gap-4',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>

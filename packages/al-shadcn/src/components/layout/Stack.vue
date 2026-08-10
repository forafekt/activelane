<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlStack' })

withDefaults(
  defineProps<{
    gap?: 'xs' | 'sm' | 'md' | 'lg'
    class?: string
  }>(),
  {
    gap: 'md',
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'grid',
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

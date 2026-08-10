<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlPage' })

withDefaults(
  defineProps<{
    width?: 'full' | 'wide' | 'normal' | 'narrow'
    dense?: boolean
    class?: string
  }>(),
  {
    width: 'normal',
  },
)
</script>

<template>
  <section
    :class="
      cn(
        'mx-auto grid w-full gap-4',
        width === 'full' && 'max-w-none',
        width === 'wide' && 'max-w-7xl',
        width === 'normal' && 'max-w-5xl',
        width === 'narrow' && 'max-w-3xl',
        dense ? 'p-3' : 'p-4 md:p-6',
        $props.class,
      )
    "
  >
    <slot />
  </section>
</template>

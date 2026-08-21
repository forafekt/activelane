<script setup lang="ts">
import { cn } from '../../lib/utils'
import { panelClass } from '../../lib/variants'

defineOptions({ name: 'Card' })

withDefaults(
  defineProps<{
    padded?: boolean
    interactive?: boolean
    class?: string
  }>(),
  {
    padded: true,
  },
)
</script>

<template>
  <section
    :class="
      cn(
        panelClass,
        padded && 'p-4',
        interactive && 'transition-colors hover:border-foreground/20 hover:bg-accent/40',
        $props.class,
      )
    "
  >
    <slot />
  </section>
</template>

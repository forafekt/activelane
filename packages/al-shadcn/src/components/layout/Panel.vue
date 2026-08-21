<script setup lang="ts">
import { cn } from '../../lib/utils'
import { panelClass } from '../../lib/variants'

defineOptions({ name: 'Panel' })

withDefaults(
  defineProps<{
    padded?: boolean
    class?: string
  }>(),
  {
    padded: false,
  },
)
</script>

<template>
  <section :class="cn(panelClass, 'overflow-hidden', padded && 'p-3', $props.class)">
    <slot />
  </section>
</template>

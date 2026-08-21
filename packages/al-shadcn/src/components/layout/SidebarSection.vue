<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'SidebarSection' })

defineProps<{
  label?: string
  class?: string
}>()
</script>

<template>
  <section :class="cn('grid gap-2', $props.class)">
    <h3
      v-if="label"
      class="px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
    >
      {{ label }}
    </h3>
    <slot />
  </section>
</template>

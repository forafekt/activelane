<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'Kbd' })

defineProps<{ class?: string }>()
</script>

<template>
  <kbd
    :class="
      cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[0.6875rem] font-medium text-muted-foreground shadow-xs',
        $props.class,
      )
    "
  >
    <slot />
  </kbd>
</template>

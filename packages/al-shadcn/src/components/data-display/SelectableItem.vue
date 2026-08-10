<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlSelectableItem' })

withDefaults(
  defineProps<{
    selected?: boolean
    disabled?: boolean
    dense?: boolean
    class?: string
  }>(),
  {
    dense: false,
  },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :data-selected="selected ? 'true' : undefined"
    :class="
      cn(
        'group flex w-full min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        dense ? 'px-2 py-1.5' : 'px-2.5 py-2',
        $props.class,
      )
    "
  >
    <slot />
  </button>
</template>

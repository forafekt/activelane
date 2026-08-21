<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'SelectableItem' })

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
        'group flex w-full min-w-0 items-center gap-2 rounded-[var(--control-radius,0.3125rem)] border border-transparent text-left text-xs transition-[background-color,border-color,color] hover:bg-[var(--control-surface-hover,var(--muted))] active:bg-[var(--control-surface-pressed,var(--accent))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:pointer-events-none disabled:opacity-45 data-[selected=true]:border-border/70 data-[selected=true]:bg-[var(--control-surface-pressed,var(--accent))] data-[selected=true]:text-accent-foreground',
        dense ? 'min-h-[var(--list-row-height,1.875rem)] px-2 py-1' : 'min-h-9 px-2.5 py-1.5',
        $props.class,
      )
    "
  >
    <slot />
  </button>
</template>

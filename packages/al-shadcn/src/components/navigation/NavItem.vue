<script setup lang="ts">
import { cn } from '../../lib/utils'
import Badge from '../ui/Badge.vue'

defineOptions({ name: 'AlNavItem' })

withDefaults(
  defineProps<{
    active?: boolean
    disabled?: boolean
    label?: string
    badge?: string | number
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
    :class="
      cn(
        'flex w-full items-center gap-2 rounded-md text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground',
        dense ? 'h-8 px-2' : 'h-9 px-2.5',
        $props.class,
      )
    "
    :data-active="active ? 'true' : undefined"
  >
    <slot name="icon" />
    <span class="min-w-0 flex-1 truncate"><slot>{{ label }}</slot></span>
    <Badge v-if="badge !== undefined" variant="outline">{{ badge }}</Badge>
  </button>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import Kbd from '../ui/Kbd.vue'

const Command = getIcon('Command')

defineOptions({ name: 'AlCommandSurface' })

defineProps<{
  label?: string
  shortcut?: string
  class?: string
}>()
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'flex h-9 min-w-0 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-muted-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        $props.class,
      )
    "
  >
    <Command class="size-4" />
    <span class="min-w-0 flex-1 truncate">{{ label ?? 'Search or run command' }}</span>
    <Kbd v-if="shortcut">{{ shortcut }}</Kbd>
  </button>
</template>

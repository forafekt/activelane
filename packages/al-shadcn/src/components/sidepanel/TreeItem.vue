<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'

const ChevronRight = getIcon('ChevronRight')

defineOptions({ name: 'AlTreeItem' })

defineProps<{
  label: string
  depth?: number
  open?: boolean
  active?: boolean
  count?: number
  hasChildren?: boolean
  class?: string
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'flex h-8 w-full items-center gap-1.5 rounded-md pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground',
        $props.class,
      )
    "
    :style="{ paddingLeft: `${0.5 + (depth ?? 0) * 0.875}rem` }"
    :data-active="active ? 'true' : undefined"
  >
    <ChevronRight
      class="size-3.5 transition-transform"
      :class="open && 'rotate-90'"
      :style="{ visibility: hasChildren ? 'visible' : 'hidden' }"
      @click.stop="emit('toggle')"
    />
    <slot name="icon" />
    <span class="min-w-0 flex-1 truncate">{{ label }}</span>
    <span v-if="count !== undefined" class="text-xs text-muted-foreground">{{ count }}</span>
  </button>
</template>

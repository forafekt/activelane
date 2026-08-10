<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { menuItemClass } from '../../lib/variants'

defineOptions({ name: 'AlContextMenu' })

withDefaults(
  defineProps<{
    items?: Array<{ id: string; label: string; disabled?: boolean; destructive?: boolean }>
    class?: string
  }>(),
  {
    items: () => [],
  },
)

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child> <slot /> </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent
        :class="cn('z-40 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none', $props.class)"
      >
        <slot name="content">
          <ContextMenuItem
            v-for="item in items"
            :key="item.id"
            :disabled="item.disabled"
            :class="cn(menuItemClass, item.destructive && 'text-destructive focus:text-destructive')"
            @select="emit('select', item.id)"
          >
            {{ item.label }}
          </ContextMenuItem>
        </slot>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

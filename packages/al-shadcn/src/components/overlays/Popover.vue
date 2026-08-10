<script setup lang="ts">
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlPopover' })

withDefaults(
  defineProps<{
    open?: boolean
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    class?: string
  }>(),
  {
    side: 'bottom',
    align: 'start',
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <PopoverRoot :open="open" @update:open="emit('update:open', $event)">
    <PopoverTrigger as-child> <slot name="trigger" /> </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="8"
        :class="cn('z-40 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none', $props.class)"
      >
        <slot />
        <PopoverArrow class="fill-popover" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

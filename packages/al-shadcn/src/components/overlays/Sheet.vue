<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'

const X = getIcon('X')

defineOptions({ name: 'AlSheet' })

withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    side?: 'left' | 'right' | 'top' | 'bottom'
    class?: string
  }>(),
  {
    side: 'right',
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogTrigger v-if="$slots.trigger" as-child> <slot name="trigger" /> </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-60 bg-[var(--overlay)] backdrop-blur-[2px]" />
      <DialogContent
        :class="
          cn(
            'fixed z-70 flex flex-col border-border bg-popover text-popover-foreground shadow-lg outline-none',
            side === 'right' && 'inset-y-0 right-0 w-[min(28rem,100vw)] border-l',
            side === 'left' && 'inset-y-0 left-0 w-[min(28rem,100vw)] border-r',
            side === 'top' && 'inset-x-0 top-0 max-h-[85vh] border-b',
            side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] border-t',
            $props.class,
          )
        "
      >
        <header
          v-if="title || $slots.header"
          class="flex h-12 shrink-0 items-center justify-between border-b border-border px-4"
        >
          <slot name="header">
            <DialogTitle class="text-sm font-semibold">{{ title }}</DialogTitle>
          </slot>
          <DialogClose
            class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X class="size-4" />
          </DialogClose>
        </header>
        <div class="min-h-0 flex-1 overflow-auto p-4"><slot /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

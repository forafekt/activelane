<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'

const X = getIcon('X')

defineOptions({ name: 'AlDialog' })

withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    description?: string
    class?: string
    hideClose?: boolean
  }>(),
  {
    hideClose: false,
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
            'fixed left-1/2 top-1/2 z-70 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-lg outline-none',
            $props.class,
          )
        "
      >
        <header v-if="title || description || $slots.header" class="grid gap-1.5">
          <slot name="header">
            <DialogTitle v-if="title" class="text-base font-semibold tracking-tight"
              >{{ title }}</DialogTitle
            >
            <DialogDescription v-if="description" class="text-sm text-muted-foreground">
              {{ description }}
            </DialogDescription>
          </slot>
        </header>
        <slot />
        <DialogClose
          v-if="!hideClose"
          class="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X class="size-4" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

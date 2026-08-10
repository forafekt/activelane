<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import Button from '../ui/Button.vue'

defineOptions({ name: 'AlAlertDialog' })

withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
  }>(),
  {
    confirmLabel: 'Continue',
    cancelLabel: 'Cancel',
    destructive: false,
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean]; confirm: [] }>()
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-60 bg-[var(--overlay)] backdrop-blur-[2px]" />
      <AlertDialogContent
        :class="cn('fixed left-1/2 top-1/2 z-70 grid w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-lg outline-none')"
      >
        <div class="grid gap-2">
          <AlertDialogTitle class="text-base font-semibold tracking-tight"
            >{{ title }}</AlertDialogTitle
          >
          <AlertDialogDescription v-if="description" class="text-sm text-muted-foreground">
            {{ description }}
          </AlertDialogDescription>
        </div>
        <slot />
        <div class="flex justify-end gap-2">
          <AlertDialogCancel as-child>
            <Button variant="outline">{{ cancelLabel }}</Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child @click="emit('confirm')">
            <Button :variant="destructive ? 'destructive' : 'default'">{{ confirmLabel }}</Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

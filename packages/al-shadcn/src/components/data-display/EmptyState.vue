<script setup lang="ts">
import type { IconComponent } from '../../componentTypes'
import { cn } from '../../lib/utils'
import Button from '../ui/Button.vue'

defineOptions({ name: 'AlEmptyState' })

defineProps<{
  title: string
  description?: string
  actionLabel?: string
  icon?: IconComponent
  class?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div
    :class="cn('grid place-items-center m-1 min-h-28 rounded-[var(--overlay-radius,0.4375rem)] border border-dashed border-border/70 bg-muted/15 p-5 text-center', $props.class)"
  >
    <div class="grid max-w-sm gap-2.5">
      <div
        v-if="$slots.icon || icon"
        class="mx-auto flex size-8 items-center justify-center rounded-[var(--control-radius,0.3125rem)] border border-border/70 bg-background text-muted-foreground"
      >
        <slot name="icon" />
        <component :is="icon" v-if="icon && !$slots.icon" class="size-4" />
      </div>
      <div class="grid gap-1">
        <h3 class="m-0 text-xs font-semibold tracking-tight">{{ title }}</h3>
        <p v-if="description" class="m-0 text-xs leading-relaxed text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <div v-if="actionLabel || $slots.action" class="flex justify-center">
        <slot name="action">
          <Button size="sm" @click="emit('action')">{{ actionLabel }}</Button>
        </slot>
      </div>
    </div>
  </div>
</template>

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
    :class="cn('grid place-items-center m-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center', $props.class)"
  >
    <div class="grid max-w-sm gap-3">
      <div
        v-if="$slots.icon || icon"
        class="mx-auto flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
      >
        <slot name="icon" />
        <component :is="icon" v-if="icon && !$slots.icon" class="size-5" />
      </div>
      <div class="grid gap-1">
        <h3 class="m-0 text-sm font-semibold tracking-tight">{{ title }}</h3>
        <p v-if="description" class="m-0 text-sm leading-relaxed text-muted-foreground">
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

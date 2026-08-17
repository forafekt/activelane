<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlPanelHeader' })

defineProps<{
  title?: string
  description?: string
  sticky?: boolean
  class?: string
}>()
</script>

<template>
  <header
    :class="
      cn(
        'flex min-h-[var(--toolbar-height,2.125rem)] items-center justify-between gap-2 border-b border-border bg-[var(--toolbar-surface,var(--background))] px-2.5 py-1 backdrop-blur-xl',
        sticky && 'sticky top-0 z-50',
        $props.class,
      )
    "
  >
    <div class="min-w-0">
      <h2 v-if="title" class="m-0 truncate text-xs font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="m-0 truncate text-[0.625rem] text-muted-foreground">
        {{ description }}
      </p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </header>
</template>

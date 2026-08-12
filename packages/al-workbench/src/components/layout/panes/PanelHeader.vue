<script setup lang="ts">
import { cn } from '@activelane/shadcn'

defineOptions({ name: 'PanelHeader' })

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
        'wb-pane-toolbar flex min-h-10 items-center justify-between gap-3 border-b border-border px-3 py-1.5',
        sticky && 'sticky top-0 z-50',
        $props.class,
      )
    "
  >
    <div class="min-w-0">
      <h2 v-if="title" class="m-0 truncate text-sm font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="m-0 truncate text-xs text-muted-foreground">{{ description }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </header>
</template>

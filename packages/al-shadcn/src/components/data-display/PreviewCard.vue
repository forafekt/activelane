<script setup lang="ts">
import { cn } from '../../lib/utils'
import Badge from '../ui/Badge.vue'

defineOptions({ name: 'AlPreviewCard' })

defineProps<{
  title: string
  description?: string
  meta?: string
  badge?: string
  selected?: boolean
  class?: string
}>()
</script>

<template>
  <article
    :class="
      cn(
        'rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/30 data-[selected=true]:border-foreground/30 data-[selected=true]:bg-accent',
        $props.class,
      )
    "
    :data-selected="selected ? 'true' : undefined"
  >
    <div class="flex items-start justify-between gap-3">
      <h3 class="m-0 line-clamp-2 text-sm font-semibold tracking-tight">{{ title }}</h3>
      <Badge v-if="badge" variant="outline">{{ badge }}</Badge>
    </div>
    <p
      v-if="description"
      class="m-0 mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground"
    >
      {{ description }}
    </p>
    <div
      v-if="meta || $slots.meta"
      class="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
    >
      <slot name="meta">{{ meta }}</slot>
    </div>
  </article>
</template>

<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlActivityListItem' })

defineProps<{
  title: string
  description?: string
  time?: string
  class?: string
}>()
</script>

<template>
  <div :class="cn('grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-2', $props.class)">
    <span class="mt-1 size-2 rounded-full bg-muted-foreground" />
    <div class="min-w-0">
      <div class="flex items-baseline justify-between gap-2">
        <p class="m-0 truncate text-sm font-medium">{{ title }}</p>
        <time v-if="time" class="shrink-0 text-xs text-muted-foreground">{{ time }}</time>
      </div>
      <p
        v-if="description"
        class="m-0 mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

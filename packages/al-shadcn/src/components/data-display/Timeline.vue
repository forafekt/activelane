<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlTimeline' })

defineProps<{
  items: Array<{ id: string; title: string; description?: string; time?: string }>
  class?: string
}>()
</script>

<template>
  <ol :class="cn('grid gap-0', $props.class)">
    <li
      v-for="item in items"
      :key="item.id"
      class="relative grid gap-1 border-l border-border pb-4 pl-4 last:pb-0"
    >
      <span
        class="absolute -left-1.5 top-1 size-3 rounded-full border border-border bg-background"
      />
      <div class="flex items-baseline justify-between gap-3">
        <h4 class="m-0 text-sm font-medium">{{ item.title }}</h4>
        <time v-if="item.time" class="shrink-0 text-xs text-muted-foreground">{{ item.time }}</time>
      </div>
      <p v-if="item.description" class="m-0 text-xs leading-relaxed text-muted-foreground">
        {{ item.description }}
      </p>
    </li>
  </ol>
</template>

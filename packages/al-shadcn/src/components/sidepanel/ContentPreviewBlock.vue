<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlContentPreviewBlock' })

defineProps<{
  title?: string
  class?: string
}>()
</script>

<template>
  <section
    :class="cn('rounded-lg border border-border bg-card p-3 text-sm shadow-sm', $props.class)"
  >
    <h3
      v-if="title"
      class="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
    >
      {{ title }}
    </h3>
    <div
      class="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-a:text-foreground prose-strong:text-foreground dark:prose-invert"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlSectionHeader' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <div :class="cn('flex min-w-0 items-start justify-between gap-3', $props.class)">
    <div class="min-w-0">
      <h2 v-if="title" class="m-0 text-sm font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
        {{ description }}
      </p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>

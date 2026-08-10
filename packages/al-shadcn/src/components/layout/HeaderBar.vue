<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlHeaderBar' })

defineProps<{
  eyebrow?: string
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <header :class="cn('flex min-w-0 items-start justify-between gap-3', $props.class)">
    <div class="min-w-0">
      <p
        v-if="eyebrow"
        class="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {{ eyebrow }}
      </p>
      <h2 v-if="title" class="m-0 truncate text-sm font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
        {{ description }}
      </p>
      <slot />
      <div v-if="$slots.meta" class="mt-2"><slot name="meta" /></div>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </header>
</template>

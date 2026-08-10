<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlTopBar' })

defineProps<{ title?: string; class?: string }>()
</script>

<template>
  <div :class="cn('flex h-12 min-w-0 items-center gap-3 px-3', $props.class)">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <slot name="leading" />
      <h1 v-if="title" class="truncate text-sm font-semibold tracking-tight">{{ title }}</h1>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>

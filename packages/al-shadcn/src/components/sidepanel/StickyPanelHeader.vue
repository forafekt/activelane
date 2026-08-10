<script setup lang="ts">
import { cn } from '../../lib/utils'
import SearchBar from '../forms/SearchBar.vue'

defineOptions({ name: 'AlStickyPanelHeader' })

defineProps<{
  title?: string
  query?: string
  searchPlaceholder?: string
  class?: string
}>()

const emit = defineEmits<{ 'update:query': [value: string] }>()
</script>

<template>
  <header
    :class="cn('sticky top-0 z-50 grid gap-2 border-b border-border bg-surface-glass p-3 backdrop-blur-xl', $props.class)"
  >
    <div class="flex min-w-0 items-center justify-between gap-2">
      <h2 v-if="title" class="m-0 truncate text-sm font-semibold tracking-tight">{{ title }}</h2>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
    <SearchBar
      v-if="query !== undefined"
      :model-value="query"
      :placeholder="searchPlaceholder"
      compact
      @update:model-value="emit('update:query', $event)"
    />
    <slot />
  </header>
</template>

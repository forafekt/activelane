<script setup lang="ts">
import type { WorkbenchCommandSearchItem } from '@activelane/workbench-api'

defineOptions({ name: 'WorkbenchCommandBarResults' })

defineProps<{
  id?: string
  items: WorkbenchCommandSearchItem[]
  selectedIndex: number
}>()

defineEmits<{
  hover: [index: number]
  select: [commandId: string]
}>()
</script>

<template>
  <div :id="id" class="wb-command-results" role="listbox" aria-label="Command results">
    <div v-if="!items.length" class="wb-command-results__empty">No commands found</div>

    <button
      v-for="(item, index) in items"
      :key="item.commandId"
      class="wb-command-results__item"
      :class="{ 'is-selected': index === selectedIndex }"
      type="button"
      :disabled="item.disabled"
      role="option"
      :aria-selected="index === selectedIndex"
      @mouseenter="$emit('hover', index)"
      @mousedown.prevent
      @click="!item.disabled && $emit('select', item.commandId)"
    >
      <span class="wb-command-results__main">
        <span class="wb-command-results__label"> {{ item.title }} </span>

        <span v-if="item.description" class="wb-command-results__description">
          {{ item.description }}
        </span>
      </span>

      <span v-if="item.shortcut || item.category" class="wb-command-results__category">
        {{ item.shortcut ? Array.isArray(item.shortcut) ? item.shortcut[0] : item.shortcut : item.category }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.wb-command-results {
  max-height: calc(min(34rem, 100vh - 7rem) - 2.65rem);
  padding: 0.375rem;
}

.wb-command-results__empty {
  padding: 1.25rem;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  text-align: center;
}

.wb-command-results__item {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-height: 2.35rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0.45rem 0.625rem;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.wb-command-results__item:hover,
.wb-command-results__item.is-selected {
  background: color-mix(in srgb, var(--focus-ring) 14%, transparent);
}

.wb-command-results__item:disabled {
  cursor: default;
  opacity: 0.5;
}

.wb-command-results__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.wb-command-results__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.wb-command-results__description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.wb-command-results__category {
  flex: 0 0 auto;
  color: var(--muted-foreground);
  font-size: 0.72rem;
}
</style>

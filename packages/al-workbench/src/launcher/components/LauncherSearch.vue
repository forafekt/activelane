<script setup lang="ts">
import { getIcon } from '@activelane/icons'

const Search = getIcon('Search')

defineOptions({ name: 'LauncherSearch' })

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="launcher-search">
    <Search class="size-5" />
    <input
      :value="modelValue"
      autocomplete="off"
      spellcheck="false"
      placeholder="Search apps, categories, extensions"
      aria-label="Search apps, categories, extensions"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<style scoped>
.launcher-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0 1rem;
  background: hsl(var(--background) / 0.92);
  color: hsl(var(--muted-foreground));
  box-shadow: 0 18px 48px hsl(var(--foreground) / 0.08);
}

.launcher-search input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: hsl(var(--foreground));
  font-size: 1rem;
  letter-spacing: 0;
}

.launcher-search input::placeholder {
  color: hsl(var(--muted-foreground));
}
</style>

<script setup lang="ts">
import type { ThemeMode } from '../../tokens'
import ViewSwitcher from '../navigation/ViewSwitcher.vue'

defineOptions({ name: 'AlThemeModeSelector' })

defineProps<{
  modelValue?: ThemeMode
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: ThemeMode] }>()

const options = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
]
</script>

<template>
  <ViewSwitcher
    :model-value="modelValue"
    :options="options"
    :class="$props.class"
    @update:model-value="emit('update:modelValue', $event as ThemeMode)"
  />
</template>

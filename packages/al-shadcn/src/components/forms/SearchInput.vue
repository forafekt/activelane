<script setup lang="ts">
import SearchBar from './SearchBar.vue'

defineOptions({ name: 'AlSearchInput' })

defineProps<{
  modelValue?: string
  placeholder?: string
  compact?: boolean
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
</script>

<template>
  <SearchBar
    :model-value="modelValue"
    :placeholder="placeholder"
    :compact="compact"
    :class="$props.class"
    @update:model-value="emit('update:modelValue', $event)"
    @clear="emit('clear')"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>

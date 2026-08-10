<script setup lang="ts">
import Dialog from './Dialog.vue'

defineOptions({ name: 'AlModal' })

defineProps<{
  modelValue?: boolean
  title?: string
  description?: string
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <Dialog
    :open="modelValue"
    :title="title"
    :description="description"
    :class="$props.class"
    @update:open="emit('update:modelValue', $event)"
  >
    <slot />
  </Dialog>
</template>

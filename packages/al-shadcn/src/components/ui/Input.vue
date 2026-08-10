<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'
import { inputClass } from '../../lib/variants'

defineOptions({ name: 'AlInput' })

defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :value="modelValue"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :class="cn(inputClass, $props.class)"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>

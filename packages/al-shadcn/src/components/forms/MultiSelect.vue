<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed } from 'vue'
import type { SelectOption } from '../../types'
import Badge from '../ui/Badge.vue'
import Combobox from './Combobox.vue'

const X = getIcon('X')

defineOptions({ name: 'AlMultiSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    options: SelectOption[]
    placeholder?: string
  }>(),
  {
    modelValue: () => [],
    placeholder: 'Add option',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const selectedOptions = computed(() =>
  props.options.filter((option) => props.modelValue.includes(option.value)),
)
const availableOptions = computed(() =>
  props.options.filter((option) => !props.modelValue.includes(option.value)),
)

function add(value: string) {
  emit('update:modelValue', [...props.modelValue, value])
}

function remove(value: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item !== value),
  )
}
</script>

<template>
  <div class="grid gap-2">
    <div v-if="selectedOptions.length" class="flex flex-wrap gap-1.5">
      <Badge v-for="option in selectedOptions" :key="option.value" variant="outline" class="gap-1">
        {{ option.label }}
        <button
          type="button"
          class="rounded-full hover:text-destructive"
          :aria-label="`Remove ${option.label}`"
          @click="remove(option.value)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </div>
    <Combobox :options="availableOptions" :placeholder="placeholder" @update:model-value="add" />
  </div>
</template>

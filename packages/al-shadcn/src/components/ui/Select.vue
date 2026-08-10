<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import type { SelectOption } from '../../types'

const ChevronDown = getIcon('ChevronDown')

defineOptions({ name: 'AlSelect' })

defineProps<{
  modelValue?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div :class="cn('relative', $props.class)">
    <select
      :value="modelValue"
      :disabled="disabled"
      class="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>

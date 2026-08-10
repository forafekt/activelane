<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'

const CalendarDays = getIcon('CalendarDays')

defineOptions({ name: 'AlDatePicker' })

defineProps<{
  modelValue?: string
  min?: string
  max?: string
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div :class="cn('relative', $props.class)">
    <input
      :value="modelValue"
      :min="min"
      :max="max"
      :disabled="disabled"
      type="date"
      class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-9 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <CalendarDays
      class="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>

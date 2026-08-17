<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { SelectOption } from '../../componentTypes'
import { cn } from '../../lib/utils'

const ChevronDown = getIcon('lucide.chevron-down')

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
      class="h-[var(--control-height,2rem)] w-full appearance-none rounded-[var(--control-radius,0.3125rem)] border border-[var(--control-border,var(--input))] bg-[var(--control-surface,var(--background))] px-2.5 py-1 pr-7 text-xs text-foreground transition-[border-color,background-color] hover:border-foreground/20 focus-visible:border-[var(--focus-outline,var(--ring))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
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
      class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>

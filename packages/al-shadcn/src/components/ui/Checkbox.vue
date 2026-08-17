<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { cn } from '../../lib/utils'

const Check = getIcon('lucide.check')

defineOptions({ name: 'AlCheckbox' })

defineProps<{
  modelValue?: boolean | 'indeterminate'
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean | 'indeterminate'] }>()
</script>

<template>
  <CheckboxRoot
    :model-value="modelValue"
    :disabled="disabled"
    :class="
      cn(
        'peer size-3.5 shrink-0 rounded-[0.1875rem] border border-[var(--control-border,var(--input))] bg-[var(--control-surface,var(--background))] transition-colors hover:border-foreground/25 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        $props.class,
      )
    "
    @update:model-value="emit('update:modelValue', $event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="size-2.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

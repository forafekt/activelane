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
        'peer size-4 shrink-0 rounded border border-input bg-background shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        $props.class,
      )
    "
    @update:model-value="emit('update:modelValue', $event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="size-3" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

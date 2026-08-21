<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { cn } from '../../lib/utils'

const Circle = getIcon('lucide:check')

defineOptions({ name: 'RadioGroup' })

defineProps<{
  modelValue?: string
  items: Array<{ value: string; label: string; description?: string; disabled?: boolean }>
  orientation?: 'horizontal' | 'vertical'
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function updateValue(value: unknown) {
  if (typeof value === 'string') {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <RadioGroupRoot
    :model-value="modelValue"
    :orientation="orientation ?? 'vertical'"
    :class="cn('grid gap-2 data-[orientation=horizontal]:flex data-[orientation=horizontal]:items-center', $props.class)"
    @update:model-value="updateValue"
  >
    <label
      v-for="item in items"
      :key="item.value"
      class="flex cursor-pointer items-start gap-2 rounded-md p-1 text-sm text-foreground has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-50"
    >
      <RadioGroupItem
        :value="item.value"
        :disabled="item.disabled"
        class="mt-0.5 size-4 rounded-full border border-input bg-background text-primary shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <RadioGroupIndicator class="flex items-center justify-center">
          <Circle class="size-2 fill-current" />
        </RadioGroupIndicator>
      </RadioGroupItem>
      <span class="grid gap-0.5">
        <span class="font-medium leading-none">{{ item.label }}</span>
        <span v-if="item.description" class="text-xs text-muted-foreground"
          >{{ item.description }}</span
        >
      </span>
    </label>
  </RadioGroupRoot>
</template>

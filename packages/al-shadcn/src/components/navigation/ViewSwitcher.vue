<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlViewSwitcher' })

defineProps<{
  modelValue?: string
  options: Array<{ value: string; label: string }>
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div
    :class="cn('inline-flex rounded-md border border-border bg-muted p-0.5', $props.class)"
    role="tablist"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="h-7 rounded px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-xs"
      :data-active="option.value === modelValue ? 'true' : undefined"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

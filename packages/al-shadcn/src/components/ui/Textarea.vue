<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlTextarea' })

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    class?: string
  }>(),
  {
    rows: 4,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <textarea
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="
      cn(
        'flex min-h-16 w-full rounded-[var(--control-radius,0.3125rem)] border border-[var(--control-border,var(--input))] bg-[var(--control-surface,var(--background))] px-2.5 py-2 text-xs leading-relaxed text-foreground transition-[border-color,background-color] placeholder:text-muted-foreground/75 hover:border-foreground/20 focus-visible:border-[var(--focus-outline,var(--ring))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

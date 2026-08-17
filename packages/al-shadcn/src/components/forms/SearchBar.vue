<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import IconButton from '../ui/IconButton.vue'

const Search = getIcon('lucide.search')
const X = getIcon('lucide.x')

defineOptions({ name: 'AlSearchBar' })

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    compact?: boolean
    class?: string
  }>(),
  {
    placeholder: 'Search',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div :class="cn('relative flex items-center', $props.class)">
    <Search class="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
    <input
      :value="modelValue"
      :placeholder="placeholder"
      type="search"
      :class="
        cn(
          'h-[var(--control-height,2rem)] w-full rounded-[var(--control-radius,0.3125rem)] border border-[var(--control-border,var(--input))] bg-[var(--control-surface,var(--background))] py-1 pl-7 pr-7 text-xs transition-[border-color,background-color] placeholder:text-muted-foreground/75 hover:border-foreground/20 focus-visible:border-[var(--focus-outline,var(--ring))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))]',
          compact && 'h-[var(--control-height-compact,1.75rem)]',
        )
      "
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
    <IconButton
      v-if="modelValue"
      label="Clear search"
      size="icon-xs"
      class="absolute right-0.5"
      @click="clear"
    >
      <X class="size-3.5" />
    </IconButton>
  </div>
</template>

<script setup lang="ts">
import { getIcons } from '@activelane/icons'
import { cn } from '../../lib/utils'
import IconButton from '../ui/IconButton.vue'

const [Search, X] = getIcons(['Search', 'X'])

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
    <Search class="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
    <input
      :value="modelValue"
      :placeholder="placeholder"
      type="search"
      :class="
        cn(
          'h-9 w-full rounded-md border border-input bg-background py-1 pl-8 pr-8 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          compact && 'h-8 text-xs',
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
      class="absolute right-1"
      @click="clear"
    >
      <X class="size-3.5" />
    </IconButton>
  </div>
</template>

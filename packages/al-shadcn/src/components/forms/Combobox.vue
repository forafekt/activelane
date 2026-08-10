<script setup lang="ts">
import { getIcons } from '@activelane/icons'
import { computed, ref } from 'vue'
import { cn } from '../../lib/utils'
import type { SelectOption } from '../../types'
import Popover from '../overlays/Popover.vue'
import Button from '../ui/Button.vue'

const [Check, ChevronDown, Search] = getIcons(['Check', 'ChevronDown', 'Search'])

defineOptions({ name: 'AlCombobox' })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    options: SelectOption[]
    placeholder?: string
    searchPlaceholder?: string
    emptyLabel?: string
    class?: string
  }>(),
  {
    placeholder: 'Select',
    searchPlaceholder: 'Search',
    emptyLabel: 'No options found',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)
const query = ref('')
const selected = computed(() => props.options.find((option) => option.value === props.modelValue))
const filtered = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return props.options
  return props.options.filter((option) =>
    [option.label, option.description, option.value]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(value),
  )
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  query.value = ''
}
</script>

<template>
  <Popover v-model:open="open" class="w-[var(--al-combobox-width,18rem)] p-0" :class="$props.class">
    <template #trigger>
      <Button
        variant="outline"
        class="w-full justify-between text-left font-normal"
        :style="{ '--al-combobox-width': '100%' }"
        :aria-expanded="open"
      >
        <span class="truncate" :class="!selected && 'text-muted-foreground'"
          >{{ selected?.label ?? placeholder }}</span
        >
        <ChevronDown class="size-4 opacity-60" />
      </Button>
    </template>

    <div class="flex h-10 items-center gap-2 border-b border-border px-3">
      <Search class="size-4 text-muted-foreground" />
      <input
        v-model="query"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        :placeholder="searchPlaceholder"
      >
    </div>
    <div class="max-h-64 overflow-auto p-1">
      <div v-if="!filtered.length" class="px-3 py-6 text-center text-sm text-muted-foreground">
        {{ emptyLabel }}
      </div>
      <button
        v-for="option in filtered"
        :key="option.value"
        type="button"
        :disabled="option.disabled"
        class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        @click="select(option.value)"
      >
        <Check class="size-4" :class="option.value === modelValue ? 'opacity-100' : 'opacity-0'" />
        <span class="min-w-0 flex-1">
          <span class="block truncate">{{ option.label }}</span>
          <span v-if="option.description" class="block truncate text-xs text-muted-foreground"
            >{{ option.description }}</span
          >
        </span>
      </button>
    </div>
  </Popover>
</template>

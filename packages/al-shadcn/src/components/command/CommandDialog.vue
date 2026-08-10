<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed, ref } from 'vue'
import type { CommandAction } from '../../types'
import Dialog from '../overlays/Dialog.vue'
import Kbd from '../ui/Kbd.vue'

const Search = getIcon('Search')

defineOptions({ name: 'AlCommandDialog' })

const props = defineProps<{
  open?: boolean
  actions: CommandAction[]
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean]; select: [action: CommandAction] }>()
const query = ref('')

const filtered = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return props.actions
  return props.actions.filter((action) =>
    [action.title, action.description, action.group, ...(action.keywords ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(value),
  )
})

const grouped = computed(() => {
  const groups = new Map<string, CommandAction[]>()
  for (const action of filtered.value) {
    const group = action.group ?? 'Actions'
    groups.set(group, [...(groups.get(group) ?? []), action])
  }
  return [...groups.entries()]
})

function select(action: CommandAction) {
  if (action.disabled) return
  emit('select', action)
  emit('update:open', false)
  query.value = ''
}
</script>

<template>
  <Dialog
    :open="open"
    hide-close
    class="max-w-2xl gap-0 overflow-hidden p-0"
    @update:open="emit('update:open', $event)"
  >
    <div class="flex h-12 items-center gap-3 border-b border-border px-4">
      <Search class="size-4 text-muted-foreground" />
      <input
        v-model="query"
        :placeholder="placeholder ?? 'Search commands, actions, and documents'"
        class="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      >
    </div>
    <div class="max-h-[26rem] overflow-auto p-2">
      <div v-if="!filtered.length" class="grid place-items-center px-6 py-12 text-center">
        <div class="grid gap-1">
          <p class="m-0 text-sm font-medium">No commands found</p>
          <p class="m-0 text-xs text-muted-foreground">Try a different word or shortcut.</p>
        </div>
      </div>
      <section v-for="[ group, groupActions ] in grouped" :key="group" class="grid gap-1 pb-2">
        <h3
          class="px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          {{ group }}
        </h3>
        <button
          v-for="action in groupActions"
          :key="action.id"
          type="button"
          :disabled="action.disabled"
          class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45"
          @click="select(action)"
        >
          <span
            v-if="action.icon"
            class="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
          >
            <component :is="action.icon" class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span
              class="block truncate text-sm font-medium"
              :class="action.destructive && 'text-destructive'"
              >{{ action.title }}</span
            >
            <span v-if="action.description" class="block truncate text-xs text-muted-foreground"
              >{{ action.description }}</span
            >
          </span>
          <span v-if="action.shortcut" class="flex gap-1">
            <Kbd
              v-for="key in Array.isArray(action.shortcut) ? action.shortcut : [action.shortcut]"
              :key="key"
              >{{ key }}</Kbd
            >
          </span>
        </button>
      </section>
    </div>
  </Dialog>
</template>

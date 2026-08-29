<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ContextAction } from '../core/types'

const props = defineProps<{ x: number; y: number; actions: ContextAction[] }>()
const emit = defineEmits<{ close: [] }>()
const menu = ref<HTMLElement>()
const style = computed(() => ({
  '--menu-x': `${Math.min(props.x, innerWidth - 220)}px`,
  '--menu-y': `${Math.min(props.y, innerHeight - 280)}px`,
}))
function close(event: Event) {
  if (!(event.target as HTMLElement).closest('.pane-menu')) emit('close')
}
function blur() {
  emit('close')
}
function run(action: ContextAction) {
  if (!action.disabled) action.run()
  emit('close')
}
function keydown(event: KeyboardEvent) {
  const buttons = [
    ...(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
  ]
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'Escape') emit('close')
  else if (event.key === 'ArrowDown') {
    event.preventDefault()
    buttons[(index + 1) % buttons.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    buttons[(index - 1 + buttons.length) % buttons.length]?.focus()
  }
}
onMounted(() => {
  window.addEventListener('pointerdown', close)
  window.addEventListener('blur', blur)
  menu.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', close)
  window.removeEventListener('blur', blur)
})
</script>
<template>
  <div ref="menu" class="pane-menu" role="menu" :style="style" @pointerdown.stop @keydown="keydown">
    <button
      type="button"
      v-for="action in actions"
      :key="action.id"
      role="menuitem"
      :disabled="action.disabled"
      :class="{ 'is-danger': action.danger }"
      @click="run(action)"
    >
      <span>{{ action.label }}</span><kbd v-if="action.shortcut">{{ action.shortcut }}</kbd>
    </button>
  </div>
</template>

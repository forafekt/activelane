<script setup lang="ts">
defineOptions({ name: 'ResizeHandle' })

const props = withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    pressed?: boolean
    hovered?: boolean
  }>(),
  { orientation: 'horizontal' },
)

const emit = defineEmits<{
  nudge: [delta: number]
}>()

function handleKeydown(event: KeyboardEvent) {
  const negative = props.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  const positive = props.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  if (event.key !== negative && event.key !== positive) return
  event.preventDefault()
  const amount = event.shiftKey ? 32 : 8
  emit('nudge', event.key === negative ? -amount : amount)
}
</script>

<template>
  <!-- biome-ignore lint/a11y/useSemanticElements: an adjustable separator must remain keyboard-focusable. -->
  <button
    type="button"
    class="wb-resize-handle"
    :class="[
      `wb-resize-handle--${orientation}`,
      { 'wb-resize-handle--active': pressed || hovered },
    ]"
    role="separator"
    :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
    :aria-valuenow="0"
    :aria-label="orientation === 'horizontal' ? 'Resize panes horizontally' : 'Resize panes vertically'"
    @keydown="handleKeydown"
  >
    <span aria-hidden="true" />
  </button>
</template>

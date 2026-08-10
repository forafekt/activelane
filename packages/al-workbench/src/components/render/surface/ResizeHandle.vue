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

<style scoped>
.wb-resize-handle {
  position: relative;
  z-index: 20;
  flex: 0 0 var(--workbench-gap);
  border: 0;
  border-radius: calc(var(--pane-radius) / 2);
  background: transparent;
  padding: 0;
  color: var(--resize-handle);
  touch-action: none;
}

.wb-resize-handle--horizontal {
  width: var(--workbench-gap);
  height: 100%;
  cursor: col-resize;
}

.wb-resize-handle--vertical {
  width: 100%;
  height: var(--workbench-gap);
  cursor: row-resize;
}

.wb-resize-handle span {
  position: absolute;
  border-radius: 999px;
  background: currentColor;
  opacity: 0;
  transition:
    opacity 120ms ease,
    transform 120ms ease,
    background-color 120ms ease;
}

.wb-resize-handle--horizontal span {
  inset-block: 0.5rem;
  left: 50%;
  width: 2px;
  transform: translateX(-50%) scaleX(0.5);
}

.wb-resize-handle--vertical span {
  inset-inline: 0.5rem;
  top: 50%;
  height: 2px;
  transform: translateY(-50%) scaleY(0.5);
}

.wb-resize-handle:hover,
.wb-resize-handle--active {
  color: var(--resize-handle-active);
}

.wb-resize-handle:hover span,
.wb-resize-handle--active span,
.wb-resize-handle:focus-visible span {
  opacity: 1;
  transform: translate(-50%, 0) scaleX(1);
}

.wb-resize-handle--vertical:hover span,
.wb-resize-handle--vertical.wb-resize-handle--active span,
.wb-resize-handle--vertical:focus-visible span {
  transform: translate(0, -50%) scaleY(1);
}

.wb-resize-handle:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}
</style>

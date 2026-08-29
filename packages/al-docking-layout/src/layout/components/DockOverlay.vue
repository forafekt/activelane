<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DragController } from '../core/drag'
import type { DockPosition } from '../core/types'

const props = defineProps<{ groupId: string; controller: DragController }>()
const host = ref<HTMLElement>()
const position = computed(() =>
  props.controller.state.targetGroupId === props.groupId ? props.controller.state.position : null,
)
function track(event: PointerEvent) {
  const rect = host.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  let next: DockPosition = 'center'
  if (x < 0.25) next = 'left'
  else if (x > 0.75) next = 'right'
  else if (y < 0.25) next = 'top'
  else if (y > 0.75) next = 'bottom'
  props.controller.target(props.groupId, next)
}
function leave() {
  if (props.controller.state.targetGroupId === props.groupId) props.controller.target(null, null)
}
</script>
<template>
  <div
    ref="host"
    class="dock-overlay"
    @pointermove="track"
    @pointerenter="track"
    @pointerleave="leave"
  >
    <div class="dock-preview" :class="position ? `dock-preview--${position}` : undefined" />
    <span class="dock-overlay__label">{{ position ?? 'Dock' }}</span>
  </div>
</template>

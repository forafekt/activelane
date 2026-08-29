<script setup lang="ts">
import { computed } from 'vue'
import type { DragController } from '../core/drag'

const props = defineProps<{ controller: DragController }>()
const style = computed(() => ({
  '--drag-x': `${props.controller.state.x}px`,
  '--drag-y': `${props.controller.state.y}px`,
}))
</script>
<template>
  <div
    v-if="controller.state.phase === 'dragging' && controller.state.payload"
    class="drag-preview"
    :style="style"
  >
    {{ controller.state.payload.kind === 'tab' ? 'Move pane' : 'Move group' }}
  </div>
</template>

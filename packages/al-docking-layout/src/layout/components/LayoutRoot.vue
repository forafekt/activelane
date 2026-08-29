<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, watch } from 'vue'
import { DragController } from '../core/drag'
import type { LayoutStore } from '../core/store'
import { layoutStoreKey } from '../core/store'
import { SurfaceMountRegistry, surfaceMountRegistryKey } from '../core/surfaces'
import { findNode } from '../core/tree'
import DragLayer from './DragLayer.vue'
import EdgeDrawers from './EdgeDrawers.vue'
import LayoutNode from './LayoutNode.vue'
import PaneSurfaces from './PaneSurfaces.vue'

const props = defineProps<{ store: LayoutStore }>()
const emit = defineEmits<{ interaction: [phase: string] }>()
const drag = new DragController()
const surfaceMounts = new SurfaceMountRegistry()
const fullscreenGroup = computed(() =>
  props.store.state.fullscreenGroupId
    ? findNode(props.store.state.root, props.store.state.fullscreenGroupId)
    : undefined,
)
provide(layoutStoreKey, props.store)
provide('layout-drag', drag)
provide(surfaceMountRegistryKey, surfaceMounts)
watch(
  () => drag.state.phase,
  (phase) => emit('interaction', phase),
  { immediate: true },
)
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    drag.cancel()
    if (props.store.state.fullscreenGroupId)
      props.store.toggleFullscreen(props.store.state.fullscreenGroupId)
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
    const group = props.store.visibleGroups.value.find((item) => item.activeTabId)
    if (group?.activeTabId) {
      event.preventDefault()
      props.store.closePane(group.activeTabId)
    }
  }
}
onMounted(() => {
  window.addEventListener('keydown', keydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', keydown)
  drag.dispose()
})
</script>

<template>
  <section
    class="dock-layout"
    aria-label="Docking workspace"
    :data-interaction-state="drag.state.phase"
  >
    <LayoutNode v-if="!fullscreenGroup" :node="store.state.root" />
    <LayoutNode v-else :node="fullscreenGroup" class="dock-fullscreen" />
    <EdgeDrawers />
    <PaneSurfaces :store="store" />
    <DragLayer :controller="drag" />
  </section>
</template>

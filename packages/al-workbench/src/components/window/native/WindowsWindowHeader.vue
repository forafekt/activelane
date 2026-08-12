<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchWindowHost } from '../../../core/host/types'
import WorkbenchCommandCenter from '../shared/WorkbenchCommandCenter.vue'
import WorkbenchMenuBar from '../shared/WorkbenchMenuBar.vue'
import WorkbenchNavigationControls from '../shared/WorkbenchNavigationControls.vue'
import WorkbenchWindowControls from '../shared/WorkbenchWindowControls.vue'
import WorkbenchLayoutControls from '../WorkbenchLayoutControls.vue'

defineOptions({ name: 'WindowsWindowHeader' })
const props = defineProps<{
  windowHost: WorkbenchWindowHost
}>()
const titleBarClasses = computed(() => ({
  'workbench-window-header-windows': true,
  'workbench-window-header-windows--maximized': props.windowHost.state.maximized,
  'workbench-window-header-windows--fullscreen': props.windowHost.state.fullscreen,
}))

function handleDoubleClick() {
  props.windowHost.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: native title bars use double-click to toggle maximize. -->
  <header
    class="workbench-window-header-windows"
    :class="titleBarClasses"
    data-workbench-drag-region
    data-wails-drag
    @dblclick="handleDoubleClick"
  >
    <WorkbenchMenuBar />
    <WorkbenchNavigationControls />
    <WorkbenchCommandCenter />
    <WorkbenchLayoutControls data-workbench-no-drag />
    <WorkbenchWindowControls :window-host="windowHost" />
  </header>
</template>

<style scoped>
header {
  --wails-draggable: drag;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchWindowHost } from '../../../core/host/types'
import WorkbenchCommandCenter from '../shared/WorkbenchCommandCenter.vue'
import WorkbenchNavigationControls from '../shared/WorkbenchNavigationControls.vue'
import WorkbenchLayoutControls from '../WorkbenchLayoutControls.vue'

defineOptions({ name: 'MacWindowHeader' })

const props = defineProps<{
  windowHost: WorkbenchWindowHost
}>()

const titleBarClasses = computed(() => ({
  'workbench-window-header-macos': true,
  'workbench-window-header-macos--maximized': props.windowHost.state.maximized,
  'workbench-window-header-macos--fullscreen': props.windowHost.state.fullscreen,
}))

function handleDoubleClick() {
  props.windowHost.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: native title bars use double-click to toggle maximize. -->
  <header
    class="workbench-window-header-macos"
    :class="titleBarClasses"
    data-workbench-drag-region
    data-wails-drag
    @dblclick="handleDoubleClick"
  >
    <div class="workbench-window-header-macos__macos-inset" aria-hidden="true" />
    <div class="workbench-window-header-macos__center">
      <WorkbenchNavigationControls />
      <WorkbenchCommandCenter />
    </div>
    <div class="workbench-window-header-macos__right">
      <WorkbenchLayoutControls data-workbench-no-drag />
    </div>
  </header>
</template>

<style scoped>
header {
  --wails-draggable: drag;
}
</style>

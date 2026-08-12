<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchWindowHost } from '../../../core/host/types'
import WorkbenchCommandCenter from '../shared/WorkbenchCommandCenter.vue'
import WorkbenchMenuBar from '../shared/WorkbenchMenuBar.vue'
import WorkbenchNavigationControls from '../shared/WorkbenchNavigationControls.vue'
import WorkbenchWindowControls from '../shared/WorkbenchWindowControls.vue'
import WorkbenchLayoutControls from '../WorkbenchLayoutControls.vue'

defineOptions({ name: 'LinuxWindowHeader' })

const props = defineProps<{
  windowHost: WorkbenchWindowHost
}>()

const titleBarClasses = computed(() => ({
  'workbench-window-header-linux': true,
  'workbench-window-header-linux--maximized': props.windowHost.state.maximized,
  'workbench-window-header-linux--fullscreen': props.windowHost.state.fullscreen,
}))

function handleDoubleClick() {
  props.windowHost.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: native title bars use double-click to toggle maximize. -->
  <header
    class="workbench-window-header-linux"
    :class="titleBarClasses"
    data-workbench-drag-region
    data-wails-drag
    @dblclick="handleDoubleClick"
  >
    <WorkbenchMenuBar />
    <div class="workbench-window-header-linux__center">
      <WorkbenchNavigationControls />
      <WorkbenchCommandCenter />
    </div>
    <div class="workbench-window-header-linux__right">
      <WorkbenchLayoutControls data-workbench-no-drag />
      <WorkbenchWindowControls :window-host="windowHost" />
    </div>
  </header>
</template>

<style scoped>
header {
  --wails-draggable: drag;
}
</style>

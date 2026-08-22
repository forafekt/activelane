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

function minimizeWindow() {
  props.windowHost.minimize()
}

function maximizeWindow() {
  props.windowHost.toggleMaximize()
}

function closeWindow() {
  props.windowHost.close()
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
    <!-- Window Action Buttons -->
      <!-- <div class="window-controls">
        <button @click="closeWindow" class="control-btn close-btn"></button>

        <button @click="minimizeWindow" class="control-btn min-btn"></button>
        <button @click="maximizeWindow" class="control-btn max-btn"></button>
      </div> -->
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
.custom-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  background-color: #1e1e1e;
  color: #ffffff;
  user-select: none;
}

.drag-region {
  flex-grow: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 12px;
  
  /* Tells Wails this whole area moves the window */
  --wails-draggable: drag; 
}

.window-controls {
  display: flex;
  gap: 8px;
  padding-right: 12px;
  
  /* CRITICAL: Overrides dragging so buttons can be clicked */
  --wails-draggable: no-drag; 
}

.control-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

/* Optional: Match macOS Traffic Light Palette */
.close-btn { background-color: #ff5f56; }
.min-btn { background-color: #ffbd2e; }
.max-btn { background-color: #27c93f; }

</style>

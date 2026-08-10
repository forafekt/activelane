<script setup lang="ts">
import { computed } from 'vue'
import WorkbenchCommandCenter from '../../../shared/components/title-bar/WorkbenchCommandCenter.vue'
import WorkbenchLayoutControls from '../../../shared/components/title-bar/WorkbenchLayoutControls.vue'
import WorkbenchMenuBar from '../../../shared/components/title-bar/WorkbenchMenuBar.vue'
import WorkbenchNavigationControls from '../../../shared/components/title-bar/WorkbenchNavigationControls.vue'
import WorkbenchWindowControls from '../../../shared/components/title-bar/WorkbenchWindowControls.vue'
import type { WorkbenchWindowChrome } from '../../../windowChrome'

defineOptions({ name: 'WorkbenchTitleBarWindows' })
const props = defineProps<{
  chrome: WorkbenchWindowChrome
}>()
const titleBarClasses = computed(() => ({
  'workbench-title-bar-windows': true,
  'workbench-title-bar-windows--maximized': props.chrome.state.maximized,
  'workbench-title-bar-windows--fullscreen': props.chrome.state.fullscreen,
}))

function handleDoubleClick() {
  props.chrome.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: <explanation> -->
  <header
    class="workbench-title-bar-windows"
    :class="titleBarClasses"
    data-workbench-drag-region
    @dblclick="handleDoubleClick"
  >
    <WorkbenchMenuBar />
    <WorkbenchNavigationControls />
    <WorkbenchCommandCenter />
    <WorkbenchLayoutControls />
    <WorkbenchWindowControls :chrome="chrome" />
  </header>
</template>

<style scoped>
.workbench-title-bar-windows {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  flex: 0 0 2.125rem;
  box-sizing: border-box;
  height: 2.125rem;
  min-height: 0;
  gap: 0.25rem;
  overflow: visible;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 94%, var(--muted));
  padding: 0 0 0 0.375rem;
}

.workbench-title-bar-windows--maximized {
  border-top: 0;
}

.workbench-title-bar-windows--fullscreen {
  height: 2rem;
  flex-basis: 2rem;
}

.workbench-title-bar-windows :deep(button),
.workbench-title-bar-windows :deep(input),
.workbench-title-bar-windows [data-workbench-no-drag],
.workbench-title-bar-windows :deep([data-workbench-no-drag]) {
  -webkit-app-region: no-drag;
}
</style>

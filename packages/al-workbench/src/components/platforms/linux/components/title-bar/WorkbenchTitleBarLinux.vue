<script setup lang="ts">
import { computed } from 'vue'
import WorkbenchCommandCenter from '../../../shared/components/title-bar/WorkbenchCommandCenter.vue'
import WorkbenchLayoutControls from '../../../shared/components/title-bar/WorkbenchLayoutControls.vue'
import WorkbenchMenuBar from '../../../shared/components/title-bar/WorkbenchMenuBar.vue'
import WorkbenchNavigationControls from '../../../shared/components/title-bar/WorkbenchNavigationControls.vue'
import WorkbenchWindowControls from '../../../shared/components/title-bar/WorkbenchWindowControls.vue'
import type { WorkbenchWindowChrome } from '../../../windowChrome'

defineOptions({ name: 'WorkbenchTitleBarLinux' })

const props = defineProps<{
  chrome: WorkbenchWindowChrome
}>()

const titleBarClasses = computed(() => ({
  'workbench-title-bar-linux': true,
  'workbench-title-bar-linux--maximized': props.chrome.state.maximized,
  'workbench-title-bar-linux--fullscreen': props.chrome.state.fullscreen,
}))

function handleDoubleClick() {
  props.chrome.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: <explanation> -->
  <header
    ref="titleBar"
    class="workbench-title-bar-linux"
    :class="titleBarClasses"
    data-workbench-drag-region
    @dblclick="handleDoubleClick"
  >
    <WorkbenchMenuBar />
    <div class="workbench-title-bar-linux__center">
      <WorkbenchNavigationControls />
      <WorkbenchCommandCenter />
    </div>
    <div class="workbench-title-bar-linux__right">
      <WorkbenchLayoutControls />
      <WorkbenchWindowControls :chrome="chrome" />
    </div>
  </header>
</template>

<style scoped>
.workbench-title-bar-linux {
  -webkit-app-region: drag;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 2.625rem;
  box-sizing: border-box;
  height: 2.625rem;
  min-height: 0;
  gap: 0.25rem;
  overflow: visible;
  border-bottom: 1px solid var(---subtle-border, var(--border));
  background: var(---titlebar, color-mix(in srgb, var(--background) 94%, var(--muted)));
  box-shadow: var(---elevation-1, var(--shadow-sm));
  backdrop-filter: blur(18px) saturate(1.08);
  padding: 0 0 0 0.5rem;
}

.workbench-title-bar-linux--maximized {
  border-top: 0;
}

.workbench-title-bar-linux--fullscreen {
  height: 2.125rem;
  flex-basis: 2.125rem;
}

.workbench-title-bar-linux :deep(button),
.workbench-title-bar-linux :deep(input),
.workbench-title-bar-linux [data-workbench-no-drag],
.workbench-title-bar-linux :deep([data-workbench-no-drag]) {
  -webkit-app-region: no-drag;
}

.workbench-title-bar-linux__center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.workbench-title-bar-linux__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.375rem;
}
</style>

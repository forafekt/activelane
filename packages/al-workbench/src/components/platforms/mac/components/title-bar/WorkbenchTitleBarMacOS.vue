<script setup lang="ts">
import { computed } from 'vue'
// import { useWorkbenchWindowChrome } from '../host/windowChrome.ts'
import WorkbenchCommandCenter from '../../../shared/components/title-bar/WorkbenchCommandCenter.vue'
import WorkbenchLayoutControls from '../../../shared/components/title-bar/WorkbenchLayoutControls.vue'
import WorkbenchNavigationControls from '../../../shared/components/title-bar/WorkbenchNavigationControls.vue'

defineOptions({ name: 'WorkbenchTitleBarMacOS' })

const props = defineProps<{
  chrome: any
}>()

// const chrome = useWorkbenchWindowChrome()
const titleBarClasses = computed(() => ({
  'workbench-title-bar-macos': true,
  'workbench-title-bar-macos--maximized': props.chrome.state.maximized,
  'workbench-title-bar-macos--fullscreen': props.chrome.state.fullscreen,
}))

function handleDoubleClick() {
  props.chrome.handleTitleBarDoubleClick()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: <explanation> -->
  <header
    class="workbench-title-bar-macos"
    :class="titleBarClasses"
    data-workbench-drag-region
    @dblclick="handleDoubleClick"
  >
    <div class="workbench-title-bar-macos__macos-inset" aria-hidden="true" />
    <div class="workbench-title-bar-macos__center">
      <WorkbenchNavigationControls />
      <WorkbenchCommandCenter />
    </div>
    <div class="workbench-title-bar-macos__right">
      <WorkbenchLayoutControls />
    </div>
  </header>
</template>

<style scoped>
.workbench-title-bar-macos {
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
  padding: 0 0.375rem 0 0;
}

.workbench-title-bar-macos--maximized {
  border-top: 0;
}

.workbench-title-bar-macos--fullscreen {
  height: 2rem;
  flex-basis: 2rem;
}

.workbench-title-bar-macos :deep(button),
.workbench-title-bar-macos :deep(input),
.workbench-title-bar-macos [data-workbench-no-drag],
.workbench-title-bar-macos :deep([data-workbench-no-drag]) {
  -webkit-app-region: no-drag;
}

.workbench-title-bar-macos__macos-inset {
  flex: 0 0 4.75rem;
  align-self: stretch;
}

.workbench-title-bar-macos :deep(.workbench-title-bar-macos__command) {
  max-width: 36rem;
}

.workbench-title-bar-macos__center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.workbench-title-bar-macos__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.375rem;
}
</style>

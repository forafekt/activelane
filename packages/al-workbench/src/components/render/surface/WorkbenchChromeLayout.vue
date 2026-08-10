<script setup lang="ts">
import { computed } from 'vue'
import { WorkbenchActivityRail } from '../../../components/navigation/activity/WorkbenchActivityRail'
import { WorkbenchStatusBar } from '../../../components/navigation/status'
import { WorkbenchTopBar } from '../../../components/navigation/window'
import { WorkbenchBottomPane } from '../../../components/panes/bottom'
import { WorkbenchSidebarPane } from '../../../components/panes/left'
import { WorkbenchInspectorPane } from '../../../components/panes/right'
import { useWorkbenchLayout } from '../../../composables/useWorkbenchLayout'
import { useWorkbenchPaneResizing } from '../../../composables/useWorkbenchPaneResizing'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import ResizeHandle from './ResizeHandle.vue'
import WorkbenchSplitLayout from './WorkbenchSplitLayout.vue'

defineOptions({ name: 'WorkbenchChromeLayout' })

withDefaults(
  defineProps<{
    topBar?: boolean
  }>(),
  {
    topBar: true,
  },
)

const runtime = useWorkbenchRuntime()

// const [AlResizeHandle] = runtime.workbench.ui.getComponents(['AlResizeHandle'])

const layout = useWorkbenchLayout(runtime)
const {
  sidebarStyle,
  inspectorStyle,
  bottomPanelStyle,
  bottomResizeCornerStyle,
  leftResizeHandleState,
  rightResizeHandleState,
  bottomResizeHandleState,
  isLeftBottomHovered,
  isRightBottomHovered,
  isLeftBottomPressed,
  isRightBottomPressed,
  beginSidebarResize,
  beginInspectorResize,
  beginBottomResize,
  beginCornerResize,
} = useWorkbenchPaneResizing(runtime)

const activityRailVisible = layout.activityRailVisible
const commandBarVisible = layout.commandBarVisible

const sidebarOpen = computed(() => !runtime.workbench.state.sidebar.collapsed)
const inspectorOpen = computed(() => !runtime.workbench.state.inspector.collapsed)
const bottomPanelOpen = computed(() => runtime.workbench.state.bottomPanel.open)
</script>

<template>
  <WorkbenchTopBar v-if="topBar" :command-bar="commandBarVisible" />

  <section class="wb-shell__workbench-row">
    <aside v-if="activityRailVisible" class="wb-shell__rail" data-workbench-part="activityRail">
      <WorkbenchActivityRail />
    </aside>

    <section class="wb-shell__body">
      <WorkbenchSidebarPane v-if="sidebarOpen" class="wb-shell__sidebar" :style="sidebarStyle" />
      <ResizeHandle
        v-if="sidebarOpen"
        orientation="horizontal"
        :hovered="leftResizeHandleState.hovered"
        :pressed="leftResizeHandleState.pressed"
        @pointerdown.prevent="beginSidebarResize"
      />

      <section class="wb-shell__main">
        <WorkbenchSplitLayout :node="runtime.workbench.state.layout" />
        <ResizeHandle
          orientation="vertical"
          :hovered="bottomResizeHandleState.hovered"
          :pressed="bottomResizeHandleState.pressed"
          @pointerdown.prevent="beginBottomResize"
        />
        <button
          type="button"
          class="wb-shell__resize-corner wb-shell__resize-corner--left"
          :style="bottomResizeCornerStyle"
          aria-label="Resize sidebar and bottom panel"
          @pointerdown.prevent="beginCornerResize($event, 'sidebar')"
          @pointerup="isLeftBottomPressed = false"
          @mouseenter="isLeftBottomHovered = true"
          @mouseleave="isLeftBottomHovered = false"
        />
        <button
          type="button"
          class="wb-shell__resize-corner wb-shell__resize-corner--right"
          :style="bottomResizeCornerStyle"
          aria-label="Resize inspector and bottom panel"
          @pointerdown.prevent="beginCornerResize($event, 'inspector')"
          @pointerup="isRightBottomPressed = false"
          @mouseenter="isRightBottomHovered = true"
          @mouseleave="isRightBottomHovered = false"
        />
        <WorkbenchBottomPane v-if="bottomPanelOpen" :style="bottomPanelStyle" />
      </section>

      <ResizeHandle
        v-if="inspectorOpen"
        orientation="horizontal"
        :hovered="rightResizeHandleState.hovered"
        :pressed="rightResizeHandleState.pressed"
        @pointerdown.prevent="beginInspectorResize"
      />
      <WorkbenchInspectorPane
        v-if="inspectorOpen"
        class="wb-shell__inspector"
        :style="inspectorStyle"
      />
    </section>
  </section>
  <WorkbenchStatusBar />
</template>

<style scoped>
.wb-shell__workbench-row {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.wb-shell__rail {
  position: sticky;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 10;
  border-right: 1px solid var(--border);
  background: var(--activity);
}

.wb-shell__body {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.wb-shell__sidebar,
.wb-shell__inspector {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
}

.wb-shell__main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--editor);
}

.wb-shell__resize-corner {
  position: absolute;
  bottom: 0;
  z-index: 120;
  width: 12px;
  height: 12px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: move;
}

.wb-shell__resize-corner:hover {
  background: color-mix(in srgb, var(--focus-ring) 14%, transparent);
}

.wb-shell__resize-corner--left {
  left: 0;
}

.wb-shell__resize-corner--right {
  right: 0;
}
</style>

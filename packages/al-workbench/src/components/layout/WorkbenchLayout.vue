<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchLayout } from '../../composables/useWorkbenchLayout'
import { useWorkbenchPaneResizing } from '../../composables/useWorkbenchPaneResizing'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import { WorkbenchActivityRail } from '../navigation/activity/WorkbenchActivityRail'
import { WorkbenchStatusBar } from '../navigation/status'
import WorkbenchInspector from './panes/WorkbenchInspector.vue'
import WorkbenchPanel from './panes/WorkbenchPanel.vue'
import WorkbenchSidebar from './panes/WorkbenchSidebar.vue'
import ResizeHandle from './ResizeHandle.vue'
import WorkbenchSplitLayout from './WorkbenchSplitLayout.vue'

defineOptions({ name: 'WorkbenchLayout' })

const runtime = useWorkbenchRuntime()

// const [AlResizeHandle] = runtime.workbench.ui.getComponents(['AlResizeHandle'])

const layout = useWorkbenchLayout(runtime)
const {
  sidebarStyle,
  inspectorStyle,
  bottomPanelStyle,
  leftBottomResizeCornerStyle,
  rightBottomResizeCornerStyle,
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
const sidebarOpen = computed(() => !runtime.workbench.state.sidebar.collapsed)
const inspectorOpen = computed(() => !runtime.workbench.state.inspector.collapsed)
const bottomPanelOpen = computed(() => runtime.workbench.state.bottomPanel.open)

function nudgeSidebar(delta: number) {
  runtime.workbench.setSidebarSize(runtime.workbench.state.sidebar.size + delta)
  void runtime.workbench.persist()
}

function nudgeInspector(delta: number) {
  runtime.workbench.setInspectorSize(runtime.workbench.state.inspector.size - delta)
  void runtime.workbench.persist()
}

function nudgeBottomPanel(delta: number) {
  runtime.workbench.setBottomPanelHeight(runtime.workbench.state.bottomPanel.height - delta)
  void runtime.workbench.persist()
}
</script>

<template>
  <section class="wb-shell__workbench-row" data-workbench-part="workspaceFrame">
    <aside v-if="activityRailVisible" class="wb-shell__rail" data-workbench-part="activityRail">
      <WorkbenchActivityRail />
    </aside>

    <section class="wb-shell__body" data-workbench-part="paneWorkspace">
      <section class="wb-shell__pane-row">
        <WorkbenchSidebar
          v-if="sidebarOpen"
          class="wb-shell__sidebar wb-structural-pane"
          :style="sidebarStyle"
        />
        <ResizeHandle
          v-if="sidebarOpen"
          orientation="horizontal"
          :hovered="leftResizeHandleState.hovered"
          :pressed="leftResizeHandleState.pressed"
          @pointerdown.prevent="beginSidebarResize"
          @nudge="nudgeSidebar"
        />

        <section class="wb-shell__main">
          <WorkbenchSplitLayout :node="runtime.workbench.state.layout" />
        </section>

        <ResizeHandle
          v-if="inspectorOpen"
          class="wb-shell__inspector-resize"
          orientation="horizontal"
          :hovered="rightResizeHandleState.hovered"
          :pressed="rightResizeHandleState.pressed"
          @pointerdown.prevent="beginInspectorResize"
          @nudge="nudgeInspector"
        />
        <WorkbenchInspector
          v-if="inspectorOpen"
          class="wb-shell__inspector wb-structural-pane"
          :style="inspectorStyle"
        />
      </section>

      <ResizeHandle
        v-if="bottomPanelOpen"
        orientation="vertical"
        :hovered="bottomResizeHandleState.hovered"
        :pressed="bottomResizeHandleState.pressed"
        @pointerdown.prevent="beginBottomResize"
        @nudge="nudgeBottomPanel"
      />
      <button
        v-if="sidebarOpen && bottomPanelOpen"
        type="button"
        class="wb-shell__resize-corner wb-shell__resize-corner--left"
        :style="leftBottomResizeCornerStyle"
        aria-label="Resize sidebar and bottom panel"
        @pointerdown.prevent="beginCornerResize($event, 'sidebar')"
        @pointerup="isLeftBottomPressed = false"
        @mouseenter="isLeftBottomHovered = true"
        @mouseleave="isLeftBottomHovered = false"
      />
      <button
        v-if="inspectorOpen && bottomPanelOpen"
        type="button"
        class="wb-shell__resize-corner wb-shell__resize-corner--right"
        :style="rightBottomResizeCornerStyle"
        aria-label="Resize inspector and bottom panel"
        @pointerdown.prevent="beginCornerResize($event, 'inspector')"
        @pointerup="isRightBottomPressed = false"
        @mouseenter="isRightBottomHovered = true"
        @mouseleave="isRightBottomHovered = false"
      />
      <WorkbenchPanel v-if="bottomPanelOpen" class="wb-structural-pane" :style="bottomPanelStyle" />
    </section>
  </section>
  <WorkbenchStatusBar />
</template>

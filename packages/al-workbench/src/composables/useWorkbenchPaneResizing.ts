import { computed, ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import { beginDockedPaneResize, dockedPaneResizeAxis } from '../dockedPaneResize'

export function useWorkbenchPaneResizing(runtime: WorkbenchRuntimeApi) {
  const isLeftBottomHovered = ref(false)
  const isRightBottomHovered = ref(false)
  const isLeftBottomPressed = ref(false)
  const isRightBottomPressed = ref(false)

  const sidebarStyle = computed(() => ({
    width: `${runtime.workbench.state.sidebar.size}px`,
  }))

  const inspectorStyle = computed(() => ({
    width: `${runtime.workbench.state.inspector.size}px`,
  }))

  const bottomPanelStyle = computed(() => ({
    height: `${runtime.workbench.state.bottomPanel.height}px`,
  }))

  const bottomResizeOffset = computed(() =>
    runtime.workbench.state.bottomPanel.open
      ? `${runtime.workbench.state.bottomPanel.height}px`
      : '0px',
  )

  const leftBottomResizeCornerStyle = computed(() => ({
    left: `${runtime.workbench.state.sidebar.size}px`,
    bottom: bottomResizeOffset.value,
  }))

  const rightBottomResizeCornerStyle = computed(() => ({
    right: `${runtime.workbench.state.inspector.size}px`,
    bottom: runtime.workbench.state.bottomPanel.open
      ? `${runtime.workbench.state.bottomPanel.height}px`
      : '0px',
  }))

  const leftResizeHandleState = computed(() => ({
    hovered: isLeftBottomHovered.value,
    pressed: isLeftBottomPressed.value,
  }))

  const rightResizeHandleState = computed(() => ({
    hovered: isRightBottomHovered.value,
    pressed: isRightBottomPressed.value,
  }))

  const bottomResizeHandleState = computed(() => ({
    hovered: isLeftBottomHovered.value || isRightBottomHovered.value,
    pressed: isLeftBottomPressed.value || isRightBottomPressed.value,
  }))

  function resizeMode() {
    return runtime.settings.get<string>('workbench.layout.panes.resizeMode')
  }

  function beginSidebarResize(event: PointerEvent) {
    beginDockedPaneResize({
      event,
      workbench: runtime.workbench,
      resizeMode: resizeMode(),
      axes: [dockedPaneResizeAxis.sidebar(event)],
    })
  }

  function beginInspectorResize(event: PointerEvent) {
    beginDockedPaneResize({
      event,
      workbench: runtime.workbench,
      resizeMode: resizeMode(),
      axes: [dockedPaneResizeAxis.inspector(event)],
    })
  }

  function beginBottomResize(event: PointerEvent) {
    beginDockedPaneResize({
      event,
      workbench: runtime.workbench,
      resizeMode: resizeMode(),
      axes: [dockedPaneResizeAxis.bottomPanel(event)],
    })
  }

  function beginCornerResize(event: PointerEvent, horizontalPane: 'sidebar' | 'inspector') {
    isLeftBottomPressed.value = horizontalPane === 'sidebar'
    isRightBottomPressed.value = horizontalPane === 'inspector'
    beginDockedPaneResize({
      event,
      workbench: runtime.workbench,
      resizeMode: resizeMode(),
      axes: [dockedPaneResizeAxis[horizontalPane](event), dockedPaneResizeAxis.bottomPanel(event)],
    })
  }

  return {
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
  }
}

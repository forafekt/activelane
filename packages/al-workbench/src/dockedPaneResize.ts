import type { WorkbenchPaneState, WorkbenchShellApi } from '@activelane/workbench-api'

export type DockedPaneId = 'sidebar' | 'inspector' | 'bottomPanel'

interface ResizeAxis {
  pane: DockedPaneId
  start: number
  position: (event: PointerEvent) => number
  sizeFromDelta: (initialSize: number, delta: number) => number
}

export interface DockedPaneResizeOptions {
  event: PointerEvent
  workbench: WorkbenchShellApi
  resizeMode?: string
  axes: ResizeAxis[]
}

interface ResizeSnapshot {
  axis: ResizeAxis
  initialSize: number
  pendingSize: number
  pendingCollapsed: boolean
}

function clamp(value: number, min: number, max?: number) {
  return Math.min(max ?? value, Math.max(min, value))
}

function paneState(workbench: WorkbenchShellApi, pane: DockedPaneId): WorkbenchPaneState {
  if (pane === 'sidebar') return workbench.state.sidebar
  if (pane === 'inspector') return workbench.state.inspector

  return {
    collapsed: !workbench.state.bottomPanel.open,
    size: workbench.state.bottomPanel.open ? workbench.state.bottomPanel.height : 0,
    minSize: 160,
    minExpandedSize: 160,
    lastExpandedSize: workbench.state.bottomPanel.height,
    collapseThreshold: 96,
    maxSize: 480,
  }
}

function commitPane(
  workbench: WorkbenchShellApi,
  pane: DockedPaneId,
  size: number,
  collapsed: boolean,
) {
  if (pane === 'sidebar') {
    if (collapsed) workbench.setSidebarCollapsed(true)
    else workbench.setSidebarSize(size)
    return
  }

  if (pane === 'inspector') {
    if (collapsed) workbench.setInspectorCollapsed(true)
    else workbench.setInspectorSize(size)
    return
  }

  if (collapsed) {
    workbench.setBottomPanelOpen(false)
    return
  }

  workbench.setBottomPanelHeight(size)
  workbench.setBottomPanelOpen(true)
}

function applyPane(
  workbench: WorkbenchShellApi,
  pane: DockedPaneId,
  size: number,
  collapsed: boolean,
) {
  if (pane === 'bottomPanel') {
    commitPane(workbench, pane, size, collapsed)
    return
  }

  const state = paneState(workbench, pane)
  if (collapsed) {
    state.collapsed = true
    state.size = 0
    return
  }

  const nextSize = clamp(size, state.minExpandedSize, state.maxSize)
  state.collapsed = false
  state.size = nextSize
  state.lastExpandedSize = nextSize
}

export const dockedPaneResizeAxis = {
  sidebar: (event: PointerEvent): ResizeAxis => ({
    pane: 'sidebar',
    start: event.clientX,
    position: (nextEvent) => nextEvent.clientX,
    sizeFromDelta: (initialSize, delta) => initialSize + delta,
  }),
  inspector: (event: PointerEvent): ResizeAxis => ({
    pane: 'inspector',
    start: event.clientX,
    position: (nextEvent) => nextEvent.clientX,
    sizeFromDelta: (initialSize, delta) => initialSize - delta,
  }),
  bottomPanel: (event: PointerEvent): ResizeAxis => ({
    pane: 'bottomPanel',
    start: event.clientY,
    position: (nextEvent) => nextEvent.clientY,
    sizeFromDelta: (initialSize, delta) => initialSize - delta,
  }),
}

export function beginDockedPaneResize(options: DockedPaneResizeOptions) {
  const deferred = options.resizeMode === 'deferred'
  const snapshots: ResizeSnapshot[] = options.axes.map((axis) => {
    const state = paneState(options.workbench, axis.pane)
    return {
      axis,
      initialSize: state.collapsed ? 0 : state.size,
      pendingSize: state.collapsed ? 0 : state.size,
      pendingCollapsed: state.collapsed,
    }
  })

  const move = (nextEvent: PointerEvent) => {
    for (const snapshot of snapshots) {
      const state = paneState(options.workbench, snapshot.axis.pane)
      const delta = snapshot.axis.position(nextEvent) - snapshot.axis.start
      const rawSize = Math.max(0, snapshot.axis.sizeFromDelta(snapshot.initialSize, delta))
      const collapsed = rawSize <= state.collapseThreshold
      const nextSize = collapsed ? 0 : clamp(rawSize, state.minExpandedSize, state.maxSize)

      snapshot.pendingCollapsed = collapsed
      snapshot.pendingSize = nextSize
      if (!deferred) applyPane(options.workbench, snapshot.axis.pane, nextSize, collapsed)
    }
  }

  const end = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    for (const snapshot of snapshots) {
      commitPane(
        options.workbench,
        snapshot.axis.pane,
        snapshot.pendingSize,
        snapshot.pendingCollapsed,
      )
    }
    void options.workbench.persist()
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
}

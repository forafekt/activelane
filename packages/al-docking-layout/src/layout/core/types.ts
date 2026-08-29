import type { Component } from 'vue'

export const LAYOUT_VERSION = 3 as const

export type Direction = 'row' | 'column'

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'center'

export type Edge = Exclude<DockPosition, 'center'>

export type OpenPolicy = 'reuse' | 'reveal' | 'new'

export type SemanticLocation = 'primary' | 'secondary' | 'panel' | 'sidebar' | 'auxiliary'

export interface PaneLifecycleContext {
  reason: string
  groupId?: string
}

export interface PaneDefinition {
  type: string
  title: string
  component: Component
  icon?: string | Component
  allowMultiple?: boolean
  defaultLocation?: SemanticLocation
  defaultMinSize?: number
  resourceKey?: (resource: unknown) => string | undefined
  onCreate?: (instance: PaneInstance, context: PaneLifecycleContext) => void
  onOpen?: (instance: PaneInstance, context: PaneLifecycleContext) => void
  onClose?: (instance: PaneInstance, context: PaneLifecycleContext) => void
  onHide?: (instance: PaneInstance, context: PaneLifecycleContext) => void
  onActivate?: (instance: PaneInstance, context: PaneLifecycleContext) => void
  onDispose?: (instance: PaneInstance, context: PaneLifecycleContext) => void
}

export interface PaneInstance {
  id: string
  type: string
  title?: string
  resourceId?: string
  resource?: unknown
  props?: Record<string, unknown>
  closable?: boolean
  movable?: boolean
}

export interface PaneGroupNode {
  kind: 'group'
  id: string
  tabs: PaneInstance[]
  activeTabId: string | null
  hiddenTabIds: string[]
  header?: PaneHeaderOptions
  location?: SemanticLocation
  minSize?: number
  maxSize?: number
}

export interface PaneHeaderOptions {
  visible: boolean
  title?: string
  icon?: string
  fullscreen?: boolean
  close?: boolean
}

export interface SplitNode {
  kind: 'split'
  id: string
  direction: Direction
  children: LayoutNode[]
  sizes: number[]
  minSizes?: number[]
  maxSizes?: number[]
}

export type LayoutNode = PaneGroupNode | SplitNode

export interface StoredPane {
  pane: PaneInstance
  previousGroupId?: string
  previousLocation?: SemanticLocation
}

export interface CollapsedGroup {
  group: PaneGroupNode
  edge: Edge
  previousParentId?: string
  previousIndex?: number
}

export interface StoredGroup {
  group: PaneGroupNode
  previousParentId?: string
  previousIndex?: number
  previousLocation?: SemanticLocation
}

export interface ResizeSnapshot {
  id: string
  label: string
  root: LayoutNode
  createdAt: number
}

export interface PersistedLayout {
  version: typeof LAYOUT_VERSION
  root: LayoutNode
  closed: StoredPane[]
  hiddenGroups: StoredGroup[]
  collapsed: CollapsedGroup[]
  fullscreenGroupId: string | null
  snapshots: ResizeSnapshot[]
}

export interface LayoutEventMap {
  change: { reason: string; state: PersistedLayout }
  transaction: { name: string; phase: 'begin' | 'commit' | 'rollback' }
  paneOpen: { pane: PaneInstance; groupId: string }
  paneClose: { pane: PaneInstance; groupId: string }
  paneHide: { pane: PaneInstance; groupId: string }
  paneDispose: { pane: PaneInstance }
  paneActivate: { pane: PaneInstance; groupId: string }
  paneMove: { pane: PaneInstance; fromGroupId: string; toGroupId: string }
  tabReorder: { paneId: string; groupId: string; fromIndex: number; toIndex: number }
  tabHide: { pane: PaneInstance; groupId: string }
  tabShow: { pane: PaneInstance; groupId: string }
  groupMove: { groupId: string; fromParentId?: string; toGroupId: string; position: DockPosition }
  groupHide: { groupId: string }
  groupShow: { groupId: string }
  fullscreenChange: { groupId: string | null }
  resize: { splitId: string; sizes: number[] }
}

export type LayoutEventName = keyof LayoutEventMap

export interface ContextAction {
  id: string
  label: string
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  run: () => void
}

export interface PaneActionContext {
  group: PaneGroupNode
  pane: PaneInstance
}

export type ContextActionProvider = (context: PaneActionContext) => ContextAction[]

export interface GroupActionContext {
  group: PaneGroupNode
}

export type GroupActionProvider = (context: GroupActionContext) => ContextAction[]

export interface DragPayload {
  kind: 'tab' | 'group'
  paneId?: string
  groupId: string
}

export type InteractionPhase = 'idle' | 'pressed' | 'dragging' | 'dropping' | 'cancelled'

export interface InteractionState {
  phase: InteractionPhase
  payload: DragPayload | null
  pointerId: number | null
  x: number
  y: number
  targetGroupId: string | null
  position: DockPosition | null
  insertionIndex: number | null
}

export interface ValidationIssue {
  code: string
  message: string
  nodeId?: string
}

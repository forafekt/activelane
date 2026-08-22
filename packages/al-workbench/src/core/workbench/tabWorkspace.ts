import type { IconReference } from '@activelane/icons'
import type { Disposable, MaybePromise } from '../shared/types'
import type {
  WorkbenchCommandExecutionContext,
  WorkbenchTab,
  WorkbenchTabInput,
} from './contributions'
import type { WorkbenchLayoutNode, WorkbenchShellState, WorkbenchTabRailGroup } from './shell'

export const WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION = 1

export type WorkbenchTabIndicatorSeverity = 'info' | 'success' | 'warning' | 'error' | 'neutral'

export interface WorkbenchTabIndicator {
  id: string
  type?: string
  severity?: WorkbenchTabIndicatorSeverity
  label: string
  tooltip?: string
  icon?: IconReference
  count?: number | string
  pulse?: boolean
  active?: boolean
  commandId?: string
  ephemeral?: boolean
  persist?: boolean
}

export interface WorkbenchTabHibernationMetadata {
  hibernated: boolean
  hibernatedAt?: string
  reason?: string
  originalSurfaceId?: string
  originalSurface?: WorkbenchTab['surface']
}

export interface WorkbenchSerializableTab {
  id: string
  kind: string
  title: string
  surfaceId?: string
  closable: boolean
  pinned: boolean
  preview: boolean
  lifecycle: WorkbenchTab['lifecycle']
  dirty: boolean
  groupId: string
  tabGroupId?: string | null
  color?: WorkbenchTab['color']
  locked?: boolean
  input?: WorkbenchTabInput
  resource?: string
  capabilities?: string[]
  ownerExtensionId?: string
  indicators?: WorkbenchTabIndicator[]
  hibernation?: WorkbenchTabHibernationMetadata
  unsupportedReason?: string
}

export interface WorkbenchSerializableTabRailGroup
  extends Omit<WorkbenchTabRailGroup, 'protection'> {
  indicators?: WorkbenchTabIndicator[]
  protected?: boolean
}

export type WorkbenchSerializableLayoutNode =
  | {
      kind: 'group'
      id: string
      tabs: WorkbenchSerializableTab[]
      tabGroups: WorkbenchSerializableTabRailGroup[]
      activeTabId: string | null
    }
  | {
      kind: 'split'
      id: string
      orientation: 'horizontal' | 'vertical'
      ratios: number[]
      children: WorkbenchSerializableLayoutNode[]
    }

export interface WorkbenchSerializedWorkspace {
  schema: 'activelane.workbench.tabs.workspace'
  version: typeof WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION
  exportedAt: string
  activeGroupId: string
  layout: WorkbenchSerializableLayoutNode
  layoutPreference?: WorkbenchShellState['layoutPreference']
  sidebar?: WorkbenchShellState['sidebar']
  inspector?: WorkbenchShellState['inspector']
  bottomPanel?: WorkbenchShellState['bottomPanel']
  warnings: string[]
}

export interface WorkbenchTabSession {
  schema: 'activelane.workbench.tabs.session'
  version: typeof WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION
  id: string
  name: string
  createdAt: string
  updatedAt: string
  workspace: WorkbenchSerializedWorkspace
}

export interface WorkbenchTabTemplate {
  schema: 'activelane.workbench.tabs.template'
  version: typeof WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION
  id: string
  name: string
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  workspace: WorkbenchSerializedWorkspace
}

export interface WorkbenchSharedTabSet {
  schema: 'activelane.workbench.tabs.shared-set'
  version: typeof WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION
  id: string
  name: string
  source: 'workspace' | 'session' | 'template' | 'tab' | 'group'
  createdAt: string
  workspace: WorkbenchSerializedWorkspace
}

export interface WorkbenchTabActionContext extends WorkbenchCommandExecutionContext {
  tab: WorkbenchTab
  groupId: string
}

export interface WorkbenchTabGroupActionContext extends WorkbenchCommandExecutionContext {
  tabGroup: WorkbenchTabRailGroup
  groupId: string
  tabs: WorkbenchTab[]
}

export interface WorkbenchRegisteredTabAction {
  id: string
  title: string
  icon?: IconReference
  category?: string
  appliesTo?: {
    tabKinds?: string[]
    ownerExtensionIds?: string[]
  }
  order?: number
  enabled?: boolean | ((context: WorkbenchTabActionContext) => boolean)
  visible?: boolean | ((context: WorkbenchTabActionContext) => boolean)
  run: (context: WorkbenchTabActionContext) => MaybePromise<void>
  ownerExtensionId?: string
}

export interface WorkbenchRegisteredTabGroupAction {
  id: string
  title: string
  icon?: IconReference
  category?: string
  order?: number
  enabled?: boolean | ((context: WorkbenchTabGroupActionContext) => boolean)
  visible?: boolean | ((context: WorkbenchTabGroupActionContext) => boolean)
  run: (context: WorkbenchTabGroupActionContext) => MaybePromise<void>
  ownerExtensionId?: string
}

export interface WorkbenchTabWorkspaceServices {
  setTabIndicator: (tabId: string, indicator: WorkbenchTabIndicator, groupId?: string) => void
  clearTabIndicator: (tabId: string, indicatorId: string, groupId?: string) => void
  setGroupIndicator: (groupId: string, indicator: WorkbenchTabIndicator) => void
  clearGroupIndicator: (groupId: string, indicatorId: string) => void
  hibernateTab: (tabId: string, groupId?: string, reason?: string) => boolean
  wakeTab: (tabId: string, groupId?: string) => boolean
  hibernateOtherTabs: (tabId: string, groupId?: string) => number
  hibernateGroup: (tabGroupId: string, groupId?: string) => number
  registerTabAction: (action: WorkbenchRegisteredTabAction) => Disposable
  unregisterTabAction: (id: string) => void
  registerTabGroupAction: (action: WorkbenchRegisteredTabGroupAction) => Disposable
  unregisterTabGroupAction: (id: string) => void
  getTabActions: (tab: WorkbenchTab, groupId: string) => WorkbenchRegisteredTabAction[]
  getTabGroupActions: (
    tabGroup: WorkbenchTabRailGroup,
    groupId: string,
  ) => WorkbenchRegisteredTabGroupAction[]
  runTabAction: (actionId: string, tabId: string, groupId?: string) => Promise<boolean>
  runTabGroupAction: (actionId: string, tabGroupId: string, groupId?: string) => Promise<boolean>
  sessions: WorkbenchTabCollectionService<WorkbenchTabSession>
  templates: WorkbenchTabCollectionService<WorkbenchTabTemplate>
  sharing: {
    createFromWorkspace: (name?: string) => WorkbenchSharedTabSet
    importPayload: (payload: unknown) => WorkbenchSharedTabSet
    apply: (set: WorkbenchSharedTabSet, options?: WorkbenchWorkspaceApplyOptions) => void
    exportJson: (set: WorkbenchSharedTabSet) => string
  }
  serializeWorkspace: () => WorkbenchSerializedWorkspace
  applyWorkspace: (
    workspace: WorkbenchSerializedWorkspace,
    options?: WorkbenchWorkspaceApplyOptions,
  ) => void
}

export interface WorkbenchWorkspaceApplyOptions {
  replace?: boolean
}

export interface WorkbenchTabCollectionService<TItem> {
  list: () => TItem[]
  saveCurrent: (name?: string) => Promise<TItem>
  save: (item: TItem) => Promise<TItem>
  get: (id: string) => TItem | undefined
  rename: (id: string, name: string) => Promise<TItem | undefined>
  duplicate: (id: string, name?: string) => Promise<TItem | undefined>
  delete: (id: string) => Promise<boolean>
  exportJson: (id: string) => string | undefined
  importJson: (json: string) => Promise<TItem>
  apply: (id: string, options?: WorkbenchWorkspaceApplyOptions) => void
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function jsonSafe<T>(value: T): T | undefined {
  if (value === undefined) return undefined
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return undefined
  }
}

function serializableIndicators(indicators?: WorkbenchTabIndicator[]) {
  return (indicators ?? [])
    .filter((indicator) => indicator.persist === true && indicator.ephemeral !== true)
    .map((indicator) => jsonSafe(indicator))
    .filter((indicator): indicator is WorkbenchTabIndicator => Boolean(indicator))
}

export function serializeWorkbenchTab(tab: WorkbenchTab): WorkbenchSerializableTab {
  const input = jsonSafe(tab.input)
  const indicators = serializableIndicators(tab.indicators)
  const hibernation = tab.hibernation
    ? {
        hibernated: tab.hibernation.hibernated,
        hibernatedAt: tab.hibernation.hibernatedAt,
        reason: tab.hibernation.reason,
        originalSurfaceId: tab.hibernation.originalSurfaceId,
      }
    : undefined
  return {
    id: tab.id,
    kind: tab.kind,
    title: tab.title,
    surfaceId: tab.hibernation?.hibernated ? tab.hibernation.originalSurfaceId : tab.surfaceId,
    closable: tab.closable,
    pinned: tab.pinned,
    preview: tab.preview,
    lifecycle: tab.lifecycle,
    dirty: tab.dirty,
    groupId: tab.groupId,
    tabGroupId: tab.tabGroupId ?? null,
    color: tab.color,
    locked: tab.locked,
    input,
    resource: tab.resource,
    capabilities: [...(tab.capabilities ?? [])],
    ownerExtensionId: tab.ownerExtensionId,
    indicators: indicators.length ? indicators : undefined,
    hibernation,
    unsupportedReason:
      input === undefined && tab.input !== undefined
        ? 'Tab input is not JSON serializable.'
        : undefined,
  }
}

export function serializeWorkbenchLayout(
  node: WorkbenchLayoutNode,
): WorkbenchSerializableLayoutNode {
  if (node.kind === 'split') {
    return {
      kind: 'split',
      id: node.id,
      orientation: node.orientation,
      ratios: [...node.ratios],
      children: node.children.map(serializeWorkbenchLayout),
    }
  }
  return {
    kind: 'group',
    id: node.id,
    activeTabId: node.activeTabId,
    tabs: node.tabs.map(serializeWorkbenchTab),
    tabGroups: node.tabGroups.map((group) => {
      const indicators = serializableIndicators(group.indicators)
      return {
        id: group.id,
        name: group.name,
        color: group.color,
        collapsed: group.collapsed,
        locked: group.locked,
        order: group.order,
        protected: Boolean(group.protection),
        indicators: indicators.length ? indicators : undefined,
      }
    }),
  }
}

export function serializeWorkbenchWorkspace(
  state: WorkbenchShellState,
): WorkbenchSerializedWorkspace {
  const workspace = {
    schema: 'activelane.workbench.tabs.workspace',
    version: WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    activeGroupId: state.activeGroupId,
    layout: serializeWorkbenchLayout(state.layout),
    layoutPreference: jsonSafe(state.layoutPreference),
    sidebar: jsonSafe(state.sidebar),
    inspector: jsonSafe(state.inspector),
    bottomPanel: jsonSafe(state.bottomPanel),
    warnings: [],
  } satisfies WorkbenchSerializedWorkspace
  collectUnsupportedWarnings(workspace.layout, workspace.warnings)
  return workspace
}

function collectUnsupportedWarnings(node: WorkbenchSerializableLayoutNode, warnings: string[]) {
  if (node.kind === 'split') {
    node.children.forEach((child) => {
      collectUnsupportedWarnings(child, warnings)
    })
    return
  }
  node.tabs.forEach((tab) => {
    if (tab.unsupportedReason) warnings.push(`${tab.title}: ${tab.unsupportedReason}`)
  })
}

export function workspaceToShellState(
  workspace: WorkbenchSerializedWorkspace,
): Partial<WorkbenchShellState> {
  return {
    activeGroupId: workspace.activeGroupId,
    layoutPreference: workspace.layoutPreference,
    sidebar: workspace.sidebar,
    inspector: workspace.inspector,
    bottomPanel: workspace.bottomPanel,
    layout: restoreLayout(workspace.layout),
  }
}

function restoreLayout(node: WorkbenchSerializableLayoutNode): WorkbenchLayoutNode {
  if (node.kind === 'split') {
    return {
      kind: 'split',
      id: node.id,
      orientation: node.orientation,
      ratios: node.ratios,
      children: node.children.map(restoreLayout),
    }
  }
  return {
    kind: 'group',
    id: node.id,
    activeTabId: node.activeTabId,
    tabGroups: node.tabGroups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      collapsed: group.collapsed,
      locked: group.locked,
      order: group.order,
      indicators: group.indicators,
      protection: null,
    })),
    tabs: node.tabs.map((tab) => ({
      ...tab,
      order: 0,
      protection: null,
      indicators: tab.indicators,
      hibernation: tab.hibernation,
    })),
  }
}

export function parseWorkbenchTabPayload<T extends { schema: string; version: number }>(
  value: string | unknown,
  schema: T['schema'],
): T {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  if (!isPlainRecord(parsed)) throw new Error('Imported payload must be a JSON object.')
  if (parsed.schema !== schema) throw new Error(`Expected ${schema} payload.`)
  if (parsed.version !== WORKBENCH_TAB_WORKSPACE_SCHEMA_VERSION) {
    throw new Error(`Unsupported tab workspace schema version: ${String(parsed.version)}.`)
  }
  return parsed as T
}

export function createTabWorkspaceId(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${prefix}:${random}`
}

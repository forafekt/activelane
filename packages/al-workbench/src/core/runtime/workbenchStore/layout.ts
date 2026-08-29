import type { WorkbenchTab } from '../../workbench/contributions'
import type {
  WorkbenchLayoutNode,
  WorkbenchShellState,
  WorkbenchSplitNode,
  WorkbenchTabGroupNode,
  WorkbenchTabRailGroup,
} from '../../workbench/shell'
import { normalizePaneState } from './panes'
import { normalizeTab, normalizeTabs } from './tabs'
import { clamp, createId } from './utils'

export const DEFAULT_GROUP_ID = 'group:root'

export const DEFAULT_LAYOUT_SPLIT_ID = 'split:root'

export const DEFAULT_LAYOUT_PREFERENCE = {
  activityRailLocation: 'left',
  activityOrder: [] as string[],
  commandBarLocation: 'workbench-top',
  commandBarVisible: true,
} satisfies WorkbenchShellState['layoutPreference']

export function createRootGroup(): WorkbenchTabGroupNode {
  return {
    kind: 'group',
    id: DEFAULT_GROUP_ID,
    tabs: [],
    tabGroups: [],
    activeTabId: null,
  }
}

export function normalizeTabRailGroups(
  groups: WorkbenchTabRailGroup[] | undefined,
  tabs: WorkbenchTab[],
) {
  const knownTabGroupIds = new Set((groups ?? []).map((group) => group.id).filter(Boolean))
  for (const tab of tabs) {
    if (tab.tabGroupId && !knownTabGroupIds.has(tab.tabGroupId)) tab.tabGroupId = null
  }
  return (groups ?? [])
    .filter((group) => group.id)
    .map((group, index) => ({
      id: group.id,
      name: group.name?.trim() || 'Group',
      color: group.color === 'default' ? undefined : group.color,
      collapsed: group.collapsed ?? false,
      locked: group.locked ?? false,
      protection: group.protection ?? null,
      indicators: group.indicators ?? [],
      order: Number.isFinite(group.order) ? group.order : index,
    }))
    .sort((left, right) => left.order - right.order)
    .map((group, index) => ({ ...group, order: index }))
}

export function normalizeRatios(ratios: number[], fallbackLength: number) {
  const base =
    ratios.length === fallbackLength ? ratios : new Array(fallbackLength).fill(1 / fallbackLength)
  const total = base.reduce((sum, value) => sum + value, 0) || 1
  return base.map((value) => value / total)
}

export function normalizeLayoutNode(
  node: WorkbenchLayoutNode | undefined,
  fallbackGroupId = DEFAULT_GROUP_ID,
): WorkbenchLayoutNode {
  if (!node) return createRootGroup()

  if (node.kind === 'group') {
    const groupId = node.id || fallbackGroupId
    const tabs = normalizeTabs((node.tabs ?? []).map((tab) => normalizeTab(tab, groupId)))
    const activeTabId =
      node.activeTabId && tabs.some((tab) => tab.id === node.activeTabId)
        ? node.activeTabId
        : (tabs[0]?.id ?? null)

    return {
      kind: 'group',
      id: groupId,
      tabs,
      tabGroups: normalizeTabRailGroups(node.tabGroups, tabs),
      activeTabId,
    }
  }

  const children = (node.children ?? []).map((child) => normalizeLayoutNode(child, fallbackGroupId))
  const nonEmptyChildren = children.filter(
    (child) => !(child.kind === 'group' && child.tabs.length === 0),
  )

  if (nonEmptyChildren.length <= 1) return nonEmptyChildren[0] ?? createRootGroup()

  return {
    kind: 'split',
    id: node.id || createId(DEFAULT_LAYOUT_SPLIT_ID),
    orientation: node.orientation === 'vertical' ? 'vertical' : 'horizontal',
    ratios: normalizeRatios(node.ratios ?? [], nonEmptyChildren.length),
    children: nonEmptyChildren,
  }
}

export function listGroupIds(node: WorkbenchLayoutNode, result: string[] = []): string[] {
  if (node.kind === 'group') {
    result.push(node.id)
    return result
  }
  node.children.forEach((child) => {
    listGroupIds(child, result)
  })
  return result
}

export function shouldShowActiveGroupIndicator(
  groupCount: number,
  groupId: string,
  activeGroupId: string,
): boolean {
  return groupCount > 1 && groupId === activeGroupId
}

export function normalizeShellState(
  partial: Partial<WorkbenchShellState>,
  fallback: WorkbenchShellState,
): Partial<WorkbenchShellState> {
  const layout = normalizeLayoutNode(partial.layout ?? fallback.layout)
  const groupIds = listGroupIds(layout)
  const activeGroupId = groupIds.includes(partial.activeGroupId ?? '')
    ? (partial.activeGroupId as string)
    : (groupIds[0] ?? DEFAULT_GROUP_ID)

  return {
    ...partial,
    hostMode: partial.hostMode ?? fallback.hostMode,
    layoutPreference: {
      activityRailLocation:
        partial.layoutPreference?.activityRailLocation ??
        fallback.layoutPreference.activityRailLocation ??
        DEFAULT_LAYOUT_PREFERENCE.activityRailLocation,
      activityOrder:
        partial.layoutPreference?.activityOrder ??
        fallback.layoutPreference.activityOrder ??
        DEFAULT_LAYOUT_PREFERENCE.activityOrder,
      commandBarLocation:
        partial.layoutPreference?.commandBarLocation ??
        fallback.layoutPreference.commandBarLocation ??
        DEFAULT_LAYOUT_PREFERENCE.commandBarLocation,
      commandBarVisible:
        partial.layoutPreference?.commandBarVisible ??
        fallback.layoutPreference.commandBarVisible ??
        DEFAULT_LAYOUT_PREFERENCE.commandBarVisible,
    },
    sidebar: normalizePaneState(partial.sidebar, fallback.sidebar),
    inspector: normalizePaneState(partial.inspector, fallback.inspector),
    bottomPanel: {
      open: partial.bottomPanel?.open ?? fallback.bottomPanel.open,
      height: clamp(partial.bottomPanel?.height ?? fallback.bottomPanel.height, 160, 480),
      activeViewId: partial.bottomPanel?.activeViewId ?? fallback.bottomPanel.activeViewId,
    },
    layout,
    activeGroupId,
    commandPaletteOpen: false,
    commandBarFocused: false,
    navigation: {
      back: partial.navigation?.back ?? fallback.navigation.back ?? [],
      forward: partial.navigation?.forward ?? fallback.navigation.forward ?? [],
    },
  }
}

export function findGroupNode(
  node: WorkbenchLayoutNode,
  groupId: string,
  parent: WorkbenchSplitNode | null = null,
): { group: WorkbenchTabGroupNode; parent: WorkbenchSplitNode | null } | null {
  if (node.kind === 'group') return node.id === groupId ? { group: node, parent } : null
  for (const child of node.children) {
    const result = findGroupNode(child, groupId, node)
    if (result) return result
  }
  return null
}

export function findGroupContainingTab(
  node: WorkbenchLayoutNode,
  tabId: string,
  parent: WorkbenchSplitNode | null = null,
): {
  group: WorkbenchTabGroupNode
  parent: WorkbenchSplitNode | null
  tab: WorkbenchTab
  tabIndex: number
} | null {
  if (node.kind === 'group') {
    const tabIndex = node.tabs.findIndex((tab) => tab.id === tabId)
    const tab = tabIndex >= 0 ? node.tabs[tabIndex] : undefined
    if (tab) return { group: node, parent, tab, tabIndex }
    return null
  }
  for (const child of node.children) {
    const result = findGroupContainingTab(child, tabId, node)
    if (result) return result
  }
  return null
}

export function locateTab(state: WorkbenchShellState, tabId: string, groupId?: string) {
  if (!groupId) return findGroupContainingTab(state.layout, tabId)
  const group = findGroupNode(state.layout, groupId)?.group
  if (!group?.tabs.some((tab) => tab.id === tabId)) return null
  return findGroupContainingTab(state.layout, tabId)
}

export function findParentSplit(
  node: WorkbenchLayoutNode,
  splitId: string,
  parent: WorkbenchSplitNode | null = null,
): WorkbenchSplitNode | null {
  if (node.kind === 'split' && node.id === splitId) return parent
  if (node.kind === 'split') {
    for (const child of node.children) {
      const result = findParentSplit(child, splitId, node)
      if (result) return result
    }
  }
  return null
}

export function collapseParentIfNeeded(state: WorkbenchShellState, groupId: string) {
  const located = findGroupNode(state.layout, groupId)
  const parent = located?.parent
  if (!parent) return

  const emptyChildren = parent.children.filter(
    (child) => child.kind === 'group' && child.tabs.length === 0,
  )
  if (!emptyChildren.length) return

  if (parent.children.length !== 2) return

  const survivor = parent.children.find(
    (child) => !(child.kind === 'group' && child.tabs.length === 0),
  )
  if (!survivor) return

  if (state.layout === parent) {
    state.layout = survivor
    return
  }

  const grand = findParentSplit(state.layout, parent.id)
  if (!grand) return
  const index = grand.children.findIndex(
    (child: WorkbenchLayoutNode) => child.kind === 'split' && child.id === parent.id,
  )
  if (index >= 0) {
    grand.children.splice(index, 1, survivor)
    grand.ratios = normalizeRatios(grand.ratios, grand.children.length)
  }
}

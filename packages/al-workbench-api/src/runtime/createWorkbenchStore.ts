import type {
  OpenWorkbenchTabOptions,
  WorkbenchHostAdapter,
  WorkbenchLayoutNode,
  WorkbenchOpenTabBehavior,
  WorkbenchShellApi,
  WorkbenchShellState,
  WorkbenchSplitNode,
  WorkbenchTab,
  WorkbenchTabColorId,
  WorkbenchTabGroupNode,
  WorkbenchTabProtectionMetadata,
  WorkbenchTabRailGroup,
} from '../index'
import { normalizeWorkbenchTabOptions } from '../workbench/normalizeComponents'
import { WORKBENCH_SHELL_STORAGE_KEY } from '../workbench/shell'
import type {
  WorkbenchRegisteredTabAction,
  WorkbenchRegisteredTabGroupAction,
  WorkbenchTabIndicator,
  WorkbenchTabWorkspaceServices,
  WorkbenchWorkspaceApplyOptions,
} from '../workbench/tabWorkspace'
import {
  parseWorkbenchTabPayload,
  serializeWorkbenchWorkspace,
  workspaceToShellState,
} from '../workbench/tabWorkspace'
import { createWorkbenchUI } from '../workbench/ui'
import { resolveWorkbenchReactivity, type WorkbenchReactivityAdapter } from './reactivity'
import {
  collapseParentIfNeeded,
  DEFAULT_GROUP_ID,
  DEFAULT_LAYOUT_SPLIT_ID,
  findGroupContainingTab,
  findGroupNode,
  listGroupIds,
  locateTab,
  normalizeRatios,
  normalizeShellState,
} from './workbenchStore/layout'
import { activeTabIdForState, rememberNavigation } from './workbenchStore/navigation'
import { createInitialShellState } from './workbenchStore/state'
import {
  createTab,
  insertTabRespectingPinned,
  normalizeTabs,
  resolveOpenMode,
  updateTabLifecycle,
} from './workbenchStore/tabs'
import { clamp, clone, createId } from './workbenchStore/utils'

export function createWorkbenchStore(
  host: WorkbenchHostAdapter,
  initialState: Partial<WorkbenchShellState> = {},
  reactivity?: Partial<WorkbenchReactivityAdapter>,
): WorkbenchShellApi {
  const reactiveAdapter = resolveWorkbenchReactivity(reactivity)
  const reactive = reactiveAdapter.reactive
  const state = reactive<WorkbenchShellState>(createInitialShellState(host.mode, initialState))
  const unlockedProtectionIds = new Set<string>()
  const recentlyClosedTabs: WorkbenchTab[] = []
  const tabActions: WorkbenchRegisteredTabAction[] = []
  const tabGroupActions: WorkbenchRegisteredTabGroupAction[] = []

  Object.assign(state, normalizeShellState(state, state))

  function getActiveGroup() {
    return (
      findGroupNode(state.layout, state.activeGroupId)?.group ??
      findGroupNode(state.layout, DEFAULT_GROUP_ID)?.group ??
      null
    )
  }

  function getActiveTab() {
    const group = getActiveGroup()
    if (!group) return null
    return group.tabs.find((tab) => tab.id === group.activeTabId) ?? group.tabs[0] ?? null
  }

  function normalizeTabGroupOrders(group: WorkbenchTabGroupNode) {
    group.tabGroups = [...(group.tabGroups ?? [])].map((item, index) => ({ ...item, order: index }))
  }

  function tabRailGroupForTab(group: WorkbenchTabGroupNode, tab: WorkbenchTab) {
    return tab.tabGroupId ? group.tabGroups.find((item) => item.id === tab.tabGroupId) : undefined
  }

  function targetProtectionIds(tab: WorkbenchTab, group: WorkbenchTabGroupNode) {
    const ids: string[] = []
    if (tab.protection) ids.push(tab.id)
    const tabGroup = tabRailGroupForTab(group, tab)
    if (tabGroup?.protection) ids.push(tabGroup.id)
    return ids
  }

  function isTabAccessBlocked(tab: WorkbenchTab, group: WorkbenchTabGroupNode) {
    return targetProtectionIds(tab, group).some((id) => !unlockedProtectionIds.has(id))
  }

  function isTabCloseBlocked(tab: WorkbenchTab, group: WorkbenchTabGroupNode) {
    return tab.locked || tabRailGroupForTab(group, tab)?.locked || isTabAccessBlocked(tab, group)
  }

  function ensureActiveGroup(groupId?: string) {
    const requested = groupId ? findGroupNode(state.layout, groupId)?.group : null
    const group = requested ?? getActiveGroup()
    if (!group) throw new Error('Workbench layout has no available tab group.')
    state.activeGroupId = group.id
    return group
  }

  function setSidebarSize(size: number) {
    const nextSize = clamp(size, state.sidebar.minExpandedSize, state.sidebar.maxSize ?? size)
    state.sidebar.size = nextSize
    state.sidebar.lastExpandedSize = nextSize
    state.sidebar.collapsed = false
  }

  function setSidebarCollapsed(collapsed: boolean) {
    if (collapsed) {
      if (state.sidebar.size > state.sidebar.collapseThreshold) {
        state.sidebar.lastExpandedSize = state.sidebar.size
      }
      state.sidebar.size = 0
    } else {
      state.sidebar.size = clamp(
        state.sidebar.lastExpandedSize || state.sidebar.minExpandedSize,
        state.sidebar.minExpandedSize,
        state.sidebar.maxSize ?? (state.sidebar.lastExpandedSize || state.sidebar.minExpandedSize),
      )
    }
    state.sidebar.collapsed = collapsed
  }

  function setInspectorSize(size: number) {
    const nextSize = clamp(size, state.inspector.minExpandedSize, state.inspector.maxSize ?? size)
    state.inspector.size = nextSize
    state.inspector.lastExpandedSize = nextSize
    state.inspector.collapsed = false
  }

  function setInspectorCollapsed(collapsed: boolean) {
    if (collapsed) {
      if (state.inspector.size > state.inspector.collapseThreshold) {
        state.inspector.lastExpandedSize = state.inspector.size
      }
      state.inspector.size = 0
    } else {
      state.inspector.size = clamp(
        state.inspector.lastExpandedSize || state.inspector.minExpandedSize,
        state.inspector.minExpandedSize,
        state.inspector.maxSize ??
          (state.inspector.lastExpandedSize || state.inspector.minExpandedSize),
      )
    }
    state.inspector.collapsed = collapsed
  }

  function setBottomPanelOpen(open: boolean) {
    state.bottomPanel.open = open
  }

  function setBottomPanelHeight(height: number) {
    state.bottomPanel.height = clamp(height, 160, 480)
  }

  function setActiveBottomPanelView(viewId: string | null) {
    state.bottomPanel.activeViewId = viewId
    if (viewId) state.bottomPanel.open = true
  }

  function setActiveActivity(activityId: string) {
    state.activeActivityId = activityId
    state.sidebar.collapsed = false
  }

  function reorderActivity(activityId: string, targetActivityId: string) {
    if (activityId === targetActivityId) return
    const knownOrder = state.layoutPreference.activityOrder
    const order = knownOrder.filter((id) => id !== activityId && id !== targetActivityId)
    const targetIndex = knownOrder.indexOf(targetActivityId)
    const insertAt = targetIndex >= 0 ? Math.min(targetIndex, order.length) : order.length
    order.splice(insertAt, 0, activityId, targetActivityId)
    state.layoutPreference.activityOrder = [...new Set(order)]
  }

  function setActivityRailLocation(
    location: WorkbenchShellState['layoutPreference']['activityRailLocation'],
  ) {
    state.layoutPreference.activityRailLocation = location
  }

  function setCommandBarLocation(
    location: WorkbenchShellState['layoutPreference']['commandBarLocation'],
  ) {
    state.layoutPreference.commandBarLocation = location
  }

  function setCommandBarVisible(visible: boolean) {
    state.layoutPreference.commandBarVisible = visible
  }

  function setActiveSidebarView(viewId: string | null) {
    state.activeSidebarViewId = viewId
    if (viewId) state.sidebar.collapsed = false
  }

  function setActiveGroup(groupId: string) {
    if (findGroupNode(state.layout, groupId)) state.activeGroupId = groupId
  }

  function activateTab(tabId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located) return
    if (isTabAccessBlocked(located.tab, located.group)) return
    if (located.tab.hibernation?.hibernated) wakeTab(tabId, located.group.id)
    rememberNavigation(state, tabId)
    located.group.activeTabId = tabId
    state.activeGroupId = located.group.id
  }

  function persistPreviewTab(tabId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || located.tab.pinned) return
    located.tab.preview = false
    updateTabLifecycle(located.tab)
  }

  function markTabEngaged(tabId: string, groupId?: string) {
    persistPreviewTab(tabId, groupId)
  }

  function openTab(input: OpenWorkbenchTabOptions, behavior: WorkbenchOpenTabBehavior = {}) {
    const normalizedInput = normalizeWorkbenchTabOptions(input, reactiveAdapter.markRaw)
    const group = ensureActiveGroup(normalizedInput.groupId)
    const existing = normalizedInput.id
      ? findGroupContainingTab(state.layout, normalizedInput.id)
      : null
    const mode = resolveOpenMode(normalizedInput, behavior)
    const shouldActivate = behavior.activate !== false
    if (existing) {
      if (isTabAccessBlocked(existing.tab, existing.group)) return existing.tab
      rememberNavigation(state, existing.tab.id)
      existing.tab.title = normalizedInput.title
      existing.tab.icon = normalizedInput.icon ?? existing.tab.icon
      existing.tab.surfaceId = normalizedInput.surfaceId ?? existing.tab.surfaceId
      existing.tab.surface = normalizedInput.surface ?? existing.tab.surface
      existing.tab.input = normalizedInput.input ?? existing.tab.input
      existing.tab.dirty = normalizedInput.dirty ?? existing.tab.dirty
      existing.tab.pinned =
        mode === 'pinned' ? true : (normalizedInput.pinned ?? existing.tab.pinned)
      existing.tab.preview = existing.tab.pinned || existing.tab.dirty ? false : mode === 'preview'
      existing.tab.closable = normalizedInput.closable ?? existing.tab.closable
      existing.tab.capabilities = normalizedInput.capabilities ?? existing.tab.capabilities ?? []
      existing.tab.tabGroupId = normalizedInput.tabGroupId ?? existing.tab.tabGroupId ?? null
      existing.tab.color = normalizedInput.color ?? existing.tab.color
      existing.tab.locked = normalizedInput.locked ?? existing.tab.locked ?? false
      existing.tab.protection = normalizedInput.protection ?? existing.tab.protection ?? null
      updateTabLifecycle(existing.tab)
      existing.group.tabs = normalizeTabs(existing.group.tabs)
      if (shouldActivate) {
        existing.group.activeTabId = existing.tab.id
        state.activeGroupId = existing.group.id
      }
      return existing.tab
    }

    const previewIndex =
      behavior.replacePreview === false || mode !== 'preview'
        ? -1
        : group.tabs.findIndex((tab) => tab.preview && !tab.pinned && !tab.dirty)
    const tab = createTab(normalizedInput, group.id, behavior)
    rememberNavigation(state, tab.id)
    if (previewIndex >= 0) group.tabs.splice(previewIndex, 1, tab)
    else insertTabRespectingPinned(group, tab)
    group.tabs = normalizeTabs(group.tabs)
    if (shouldActivate) {
      group.activeTabId = tab.id
      state.activeGroupId = group.id
    }
    return tab
  }

  function replacePreviewTab(
    input: OpenWorkbenchTabOptions,
    behavior: WorkbenchOpenTabBehavior = {},
  ) {
    return openTab(input, { ...behavior, mode: behavior.mode ?? 'preview', replacePreview: true })
  }

  function closeTab(tabId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located) return
    if (located.tab.closable === false || isTabCloseBlocked(located.tab, located.group)) return
    recentlyClosedTabs.unshift(clone(located.tab))
    recentlyClosedTabs.splice(20)
    located.group.tabs.splice(located.tabIndex, 1)
    normalizeTabGroupOrders(located.group)
    if (located.group.activeTabId === tabId) {
      located.group.activeTabId =
        located.group.tabs[Math.max(0, located.tabIndex - 1)]?.id ??
        located.group.tabs[0]?.id ??
        null
    }
    collapseParentIfNeeded(state, located.group.id)
    state.navigation.back = state.navigation.back.filter((id) => id !== tabId)
    state.navigation.forward = state.navigation.forward.filter((id) => id !== tabId)
    if (state.activeGroupId === located.group.id && located.group.activeTabId) {
      state.activeGroupId = located.group.id
    }
  }

  function closeTabs(tabIds: string[], groupId?: string) {
    for (const tabId of tabIds) closeTab(tabId, groupId)
  }

  function closeActiveTab() {
    const activeTab = getActiveTab()
    if (!activeTab) return
    closeTab(activeTab.id, activeTab.groupId)
  }

  function setTabPinned(tabId: string, pinned: boolean, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located) return
    if (isTabAccessBlocked(located.tab, located.group)) return
    located.tab.pinned = pinned
    if (pinned) located.tab.preview = false
    updateTabLifecycle(located.tab)
    located.group.tabs = normalizeTabs(located.group.tabs)
  }

  function pinTab(tabId: string, groupId?: string) {
    setTabPinned(tabId, true, groupId)
  }

  function unpinTab(tabId: string, groupId?: string) {
    setTabPinned(tabId, false, groupId)
  }

  function setTabTitle(tabId: string, title: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || isTabAccessBlocked(located.tab, located.group)) return
    const nextTitle = title.trim()
    if (!nextTitle) return
    located.tab.title = nextTitle
  }

  function reorderTab(tabId: string, targetTabId: string, groupId?: string) {
    if (tabId === targetTabId) return
    const group = groupId ? findGroupNode(state.layout, groupId)?.group : getActiveGroup()
    if (!group) return
    const fromIndex = group.tabs.findIndex((tab) => tab.id === tabId)
    const toIndex = group.tabs.findIndex((tab) => tab.id === targetTabId)
    if (fromIndex < 0 || toIndex < 0) return
    const tab = group.tabs[fromIndex]
    const target = group.tabs[toIndex]
    if (!tab || !target || tab.pinned !== target.pinned) return
    if (isTabAccessBlocked(tab, group) || isTabAccessBlocked(target, group)) return
    if (tab.preview) {
      tab.preview = false
      updateTabLifecycle(tab)
    }
    group.tabs.splice(fromIndex, 1)
    const nextIndex = group.tabs.findIndex((item) => item.id === targetTabId)
    group.tabs.splice(nextIndex >= 0 ? nextIndex : group.tabs.length, 0, tab)
  }

  function moveTabToGroup(tabId: string, targetGroupId: string) {
    const source = findGroupContainingTab(state.layout, tabId)
    const target = findGroupNode(state.layout, targetGroupId)?.group
    if (!source || !target) return
    if (isTabAccessBlocked(source.tab, source.group)) return
    const [tab] = source.group.tabs.splice(source.tabIndex, 1)
    if (!tab) return
    tab.groupId = target.id
    tab.tabGroupId = null
    tab.preview = false
    updateTabLifecycle(tab)
    insertTabRespectingPinned(target, tab)
    normalizeTabGroupOrders(source.group)
    target.activeTabId = tab.id
    state.activeGroupId = target.id
    collapseParentIfNeeded(state, source.group.id)
  }

  function focusRelativeGroup(direction: 1 | -1) {
    const groupIds = listGroupIds(state.layout)
    const currentIndex = groupIds.indexOf(state.activeGroupId)
    if (currentIndex < 0 || groupIds.length < 2) return null
    const nextIndex = (currentIndex + direction + groupIds.length) % groupIds.length
    const nextGroupId = groupIds[nextIndex] ?? null
    if (nextGroupId) state.activeGroupId = nextGroupId
    return nextGroupId
  }

  function navigate(history: 'back' | 'forward') {
    const source = state.navigation[history]
    const tabId = source[source.length - 1]
    if (!tabId) return null
    const located = findGroupContainingTab(state.layout, tabId)
    source.pop()
    if (!located) return null
    const current = activeTabIdForState(state)
    const opposite = history === 'back' ? state.navigation.forward : state.navigation.back
    if (current) opposite.push(current)
    located.group.activeTabId = located.tab.id
    state.activeGroupId = located.group.id
    return located.tab
  }

  function splitActiveTab(orientation: 'horizontal' | 'vertical') {
    const sourceGroup = getActiveGroup()
    const sourceTabId = sourceGroup?.activeTabId
    if (!sourceGroup || !sourceTabId) return null
    const source = findGroupContainingTab(state.layout, sourceTabId)
    if (!source) return null

    const newGroup: WorkbenchTabGroupNode = {
      kind: 'group',
      id: createId('group'),
      tabs: [],
      tabGroups: [],
      activeTabId: null,
    }

    const duplicatedTab: WorkbenchTab = {
      ...clone(source.tab),
      id: createId(`tab:${source.tab.kind}`),
      groupId: newGroup.id,
      tabGroupId: null,
      preview: false,
    }
    updateTabLifecycle(duplicatedTab)
    newGroup.tabs.push(duplicatedTab)
    newGroup.activeTabId = duplicatedTab.id

    const replacement: WorkbenchSplitNode = {
      kind: 'split',
      id: createId(DEFAULT_LAYOUT_SPLIT_ID),
      orientation,
      ratios: [0.5, 0.5],
      children: [source.group, newGroup],
    }

    if (state.layout === source.group) {
      state.layout = replacement
    } else if (source.parent) {
      const index = source.parent.children.findIndex(
        (child: WorkbenchLayoutNode) => child.kind === 'group' && child.id === source.group.id,
      )
      if (index >= 0) {
        source.parent.children.splice(index, 1, replacement)
        source.parent.ratios = normalizeRatios(source.parent.ratios, source.parent.children.length)
      }
    }

    source.group.activeTabId = source.tab.id
    state.activeGroupId = newGroup.id
    return duplicatedTab
  }

  function setSplitRatios(splitId: string, ratios: number[]) {
    const queue: WorkbenchLayoutNode[] = [state.layout]
    while (queue.length) {
      const node = queue.shift()
      if (!node) continue
      if (node.kind === 'split' && node.id === splitId) {
        node.ratios = normalizeRatios(ratios, node.children.length)
        return
      }
      if (node.kind === 'split') queue.push(...node.children)
    }
  }

  async function persist() {
    const storage = host.capabilities.storage?.scope('workbench.shell')
    if (!storage) return
    await storage.set(WORKBENCH_SHELL_STORAGE_KEY, clone(state))
  }

  function restore(partial: Partial<WorkbenchShellState>) {
    Object.assign(state, normalizeShellState(clone(partial), state))
  }

  function duplicateTab(tabId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || isTabAccessBlocked(located.tab, located.group)) return null
    const duplicated: WorkbenchTab = {
      ...clone(located.tab),
      id: createId(`tab:${located.tab.kind}`),
      title: `${located.tab.title} Copy`,
      preview: false,
    }
    updateTabLifecycle(duplicated)
    insertTabRespectingPinned(located.group, duplicated)
    located.group.activeTabId = duplicated.id
    state.activeGroupId = located.group.id
    return duplicated
  }

  function reopenClosedTab(groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tab = recentlyClosedTabs.shift()
    if (!tab) return null
    const reopened: WorkbenchTab = {
      ...tab,
      id: tab.id,
      groupId: group.id,
      tabGroupId: null,
      preview: false,
    }
    updateTabLifecycle(reopened)
    insertTabRespectingPinned(group, reopened)
    group.activeTabId = reopened.id
    state.activeGroupId = group.id
    return reopened
  }

  function createTabGroup(name: string, groupId?: string, tabIds: string[] = []) {
    const group = ensureActiveGroup(groupId)
    const tabGroup: WorkbenchTabRailGroup = {
      id: createId('tab-group'),
      name: name.trim() || 'Group',
      collapsed: false,
      order: group.tabGroups.length,
    }
    group.tabGroups.push(tabGroup)
    for (const tab of group.tabs) {
      if (tabIds.includes(tab.id) && !isTabAccessBlocked(tab, group)) tab.tabGroupId = tabGroup.id
    }
    normalizeTabGroupOrders(group)
    return tabGroup
  }

  function findTabGroup(group: WorkbenchTabGroupNode, tabGroupId: string) {
    return group.tabGroups.find((item) => item.id === tabGroupId) ?? null
  }

  function renameTabGroup(tabGroupId: string, name: string, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    tabGroup.name = name.trim() || tabGroup.name
  }

  function reorderTabGroup(tabGroupId: string, targetTabGroupId: string, groupId?: string) {
    if (tabGroupId === targetTabGroupId) return
    const group = ensureActiveGroup(groupId)
    const fromIndex = group.tabGroups.findIndex((item) => item.id === tabGroupId)
    const toIndex = group.tabGroups.findIndex((item) => item.id === targetTabGroupId)
    if (fromIndex < 0 || toIndex < 0) return
    const [item] = group.tabGroups.splice(fromIndex, 1)
    if (!item) return
    group.tabGroups.splice(toIndex, 0, item)
    normalizeTabGroupOrders(group)
  }

  function moveTabToTabGroup(tabId: string, tabGroupId: string | null, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || isTabAccessBlocked(located.tab, located.group)) return
    const nextGroup = tabGroupId ? findTabGroup(located.group, tabGroupId) : null
    if (tabGroupId && !nextGroup) return
    if (nextGroup?.protection && !unlockedProtectionIds.has(nextGroup.id)) return
    located.tab.tabGroupId = tabGroupId
    normalizeTabGroupOrders(located.group)
  }

  function setTabGroupCollapsed(tabGroupId: string, collapsed: boolean, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    tabGroup.collapsed = collapsed
  }

  function ungroupTabs(tabGroupId: string, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    group.tabs.forEach((tab) => {
      if (tab.tabGroupId === tabGroupId && !isTabAccessBlocked(tab, group)) tab.tabGroupId = null
    })
    group.tabGroups = group.tabGroups.filter((item) => item.id !== tabGroupId)
    normalizeTabGroupOrders(group)
  }

  function closeTabGroup(tabGroupId: string, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    closeTabs(
      group.tabs.filter((tab) => tab.tabGroupId === tabGroupId).map((tab) => tab.id),
      group.id,
    )
    if (!group.tabs.some((tab) => tab.tabGroupId === tabGroupId)) {
      group.tabGroups = group.tabGroups.filter((item) => item.id !== tabGroupId)
    }
    normalizeTabGroupOrders(group)
  }

  function closeOtherTabGroups(tabGroupId: string, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const otherTabGroupIds = new Set(
      group.tabGroups.filter((item) => item.id !== tabGroupId).map((item) => item.id),
    )
    closeTabs(
      group.tabs
        .filter((tab) => tab.tabGroupId && tab.tabGroupId !== tabGroupId)
        .map((tab) => tab.id),
      group.id,
    )
    group.tabGroups = group.tabGroups.filter(
      (item) =>
        !otherTabGroupIds.has(item.id) || group.tabs.some((tab) => tab.tabGroupId === item.id),
    )
    normalizeTabGroupOrders(group)
  }

  function setTabColor(tabId: string, color: WorkbenchTabColorId | undefined, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || isTabAccessBlocked(located.tab, located.group)) return
    located.tab.color = color === 'default' ? undefined : color
  }

  function setTabGroupColor(
    tabGroupId: string,
    color: WorkbenchTabColorId | undefined,
    groupId?: string,
  ) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    tabGroup.color = color === 'default' ? undefined : color
  }

  function setTabLocked(tabId: string, locked: boolean, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located || isTabAccessBlocked(located.tab, located.group)) return
    located.tab.locked = locked
  }

  function setTabGroupLocked(tabGroupId: string, locked: boolean, groupId?: string) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    tabGroup.locked = locked
  }

  function setTabProtection(
    tabId: string,
    protection: WorkbenchTabProtectionMetadata | null,
    groupId?: string,
  ) {
    const located = locateTab(state, tabId, groupId)
    if (!located || (located.tab.protection && !unlockedProtectionIds.has(located.tab.id))) return
    located.tab.protection = protection
    if (!protection) unlockedProtectionIds.delete(tabId)
  }

  function setTabGroupProtection(
    tabGroupId: string,
    protection: WorkbenchTabProtectionMetadata | null,
    groupId?: string,
  ) {
    const group = ensureActiveGroup(groupId)
    const tabGroup = findTabGroup(group, tabGroupId)
    if (!tabGroup || (tabGroup.protection && !unlockedProtectionIds.has(tabGroup.id))) return
    tabGroup.protection = protection
    if (!protection) unlockedProtectionIds.delete(tabGroupId)
  }

  function upsertIndicator(
    indicators: WorkbenchTabIndicator[] | undefined,
    indicator: WorkbenchTabIndicator,
  ) {
    const next = [...(indicators ?? [])]
    const index = next.findIndex((item) => item.id === indicator.id)
    if (index >= 0) next.splice(index, 1, indicator)
    else next.push(indicator)
    return next
  }

  function setTabIndicator(tabId: string, indicator: WorkbenchTabIndicator, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located) return
    located.tab.indicators = upsertIndicator(located.tab.indicators, indicator)
  }

  function clearTabIndicator(tabId: string, indicatorId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located) return
    located.tab.indicators = (located.tab.indicators ?? []).filter(
      (item) => item.id !== indicatorId,
    )
  }

  function setGroupIndicator(groupId: string, indicator: WorkbenchTabIndicator) {
    for (const groupIdCandidate of listGroupIds(state.layout)) {
      const group = findGroupNode(state.layout, groupIdCandidate)?.group
      const tabGroup = group?.tabGroups.find((item) => item.id === groupId)
      if (tabGroup) tabGroup.indicators = upsertIndicator(tabGroup.indicators, indicator)
    }
  }

  function clearGroupIndicator(groupId: string, indicatorId: string) {
    for (const groupIdCandidate of listGroupIds(state.layout)) {
      const group = findGroupNode(state.layout, groupIdCandidate)?.group
      const tabGroup = group?.tabGroups.find((item) => item.id === groupId)
      if (tabGroup) {
        tabGroup.indicators = (tabGroup.indicators ?? []).filter((item) => item.id !== indicatorId)
      }
    }
  }

  function hibernateTab(tabId: string, groupId?: string, reason = 'Manual hibernation') {
    const located = locateTab(state, tabId, groupId)
    if (!located) return false
    if (located.tab.dirty || located.tab.locked || isTabAccessBlocked(located.tab, located.group))
      return false
    if (located.tab.hibernation?.hibernated) return true
    located.tab.hibernation = {
      hibernated: true,
      hibernatedAt: new Date().toISOString(),
      reason,
      originalSurfaceId: located.tab.surfaceId,
      originalSurface: located.tab.surface,
    }
    located.tab.surface = undefined
    located.tab.surfaceId = 'workbench.hibernated'
    setTabIndicator(
      tabId,
      {
        id: 'workbench.hibernate',
        label: 'Hibernated',
        tooltip: reason,
        icon: 'Snowflake',
        severity: 'neutral',
        persist: true,
      },
      located.group.id,
    )
    return true
  }

  function wakeTab(tabId: string, groupId?: string) {
    const located = locateTab(state, tabId, groupId)
    if (!located?.tab.hibernation?.hibernated) return false
    located.tab.surfaceId = located.tab.hibernation.originalSurfaceId
    located.tab.surface = located.tab.hibernation.originalSurface
    located.tab.hibernation = { ...located.tab.hibernation, hibernated: false }
    clearTabIndicator(tabId, 'workbench.hibernate', located.group.id)
    return true
  }

  function hibernateOtherTabs(tabId: string, groupId?: string) {
    const group = groupId ? findGroupNode(state.layout, groupId)?.group : getActiveGroup()
    if (!group) return 0
    return group.tabs
      .filter((tab) => tab.id !== tabId)
      .reduce(
        (count, tab) => count + (hibernateTab(tab.id, group.id, 'Hibernate other tabs') ? 1 : 0),
        0,
      )
  }

  function hibernateGroup(tabGroupId: string, groupId?: string) {
    const group = groupId ? findGroupNode(state.layout, groupId)?.group : getActiveGroup()
    if (!group) return 0
    return group.tabs
      .filter((tab) => tab.tabGroupId === tabGroupId)
      .reduce(
        (count, tab) => count + (hibernateTab(tab.id, group.id, 'Hibernate group') ? 1 : 0),
        0,
      )
  }

  function applyWorkspace(
    workspace: ReturnType<typeof serializeWorkbenchWorkspace>,
    options: WorkbenchWorkspaceApplyOptions = {},
  ) {
    if (options.replace !== false) restore(workspaceToShellState(workspace))
    else {
      const next = workspaceToShellState(workspace)
      const nextLayout = next.layout
      const group = getActiveGroup()
      if (!group || nextLayout?.kind !== 'group') return
      for (const tab of nextLayout.tabs)
        openTab(tab, {
          activate: false,
          mode: tab.pinned ? 'pinned' : 'persistent',
          replacePreview: false,
          source: 'restore',
        })
      for (const tabGroup of nextLayout.tabGroups) {
        if (!group.tabGroups.some((item) => item.id === tabGroup.id)) group.tabGroups.push(tabGroup)
      }
    }
  }

  const unavailableCollection = {
    list: () => [],
    saveCurrent: async () => {
      throw new Error('Tab workspace persistence is available on extension runtimes.')
    },
    save: async (item: never) => item,
    get: () => undefined,
    rename: async () => undefined,
    duplicate: async () => undefined,
    delete: async () => false,
    exportJson: () => undefined,
    importJson: async (json: string) =>
      parseWorkbenchTabPayload(json, 'activelane.workbench.tabs.session'),
    apply: () => undefined,
  }

  const tabsService: WorkbenchTabWorkspaceServices = {
    setTabIndicator,
    clearTabIndicator,
    setGroupIndicator,
    clearGroupIndicator,
    hibernateTab,
    wakeTab,
    hibernateOtherTabs,
    hibernateGroup,
    registerTabAction(action) {
      tabActions.push(action)
      return { dispose: () => tabsService.unregisterTabAction(action.id) }
    },
    unregisterTabAction(id) {
      const index = tabActions.findIndex((item) => item.id === id)
      if (index >= 0) tabActions.splice(index, 1)
    },
    registerTabGroupAction(action) {
      tabGroupActions.push(action)
      return { dispose: () => tabsService.unregisterTabGroupAction(action.id) }
    },
    unregisterTabGroupAction(id) {
      const index = tabGroupActions.findIndex((item) => item.id === id)
      if (index >= 0) tabGroupActions.splice(index, 1)
    },
    getTabActions(tab) {
      return tabActions
        .filter((action) => {
          if (action.appliesTo?.tabKinds?.length && !action.appliesTo.tabKinds.includes(tab.kind))
            return false
          if (
            action.appliesTo?.ownerExtensionIds?.length &&
            !action.appliesTo.ownerExtensionIds.includes(tab.ownerExtensionId ?? '')
          )
            return false
          return true
        })
        .sort(
          (left, right) =>
            (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title),
        )
    },
    getTabGroupActions() {
      return [...tabGroupActions].sort(
        (left, right) =>
          (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title),
      )
    },
    runTabAction: async () => false,
    runTabGroupAction: async () => false,
    sessions: unavailableCollection as never,
    templates: unavailableCollection as never,
    sharing: {
      createFromWorkspace(name = 'Shared Tab Set') {
        return {
          schema: 'activelane.workbench.tabs.shared-set',
          version: 1,
          id: createId('shared-tab-set'),
          name,
          source: 'workspace',
          createdAt: new Date().toISOString(),
          workspace: serializeWorkbenchWorkspace(state),
        }
      },
      importPayload(payload) {
        return parseWorkbenchTabPayload(payload, 'activelane.workbench.tabs.shared-set')
      },
      apply: (set, options) => applyWorkspace(set.workspace, options),
      exportJson: (set) => JSON.stringify(set, null, 2),
    },
    serializeWorkspace: () => serializeWorkbenchWorkspace(state),
    applyWorkspace,
  }

  return {
    ui: createWorkbenchUI(),
    state,
    getActiveTab,
    openTab,
    replacePreviewTab,
    closeTab,
    closeTabs,
    closeActiveTab,
    activateTab,
    markTabDirty: (tabId, dirty, groupId) => {
      const located = locateTab(state, tabId, groupId)
      if (!located) return
      located.tab.dirty = dirty
      updateTabLifecycle(located.tab)
    },
    pinTab,
    unpinTab,
    setTabPinned,
    setTabTitle,
    persistPreviewTab,
    markTabEngaged,
    reorderTab,
    duplicateTab,
    reopenClosedTab,
    createTabGroup,
    renameTabGroup,
    reorderTabGroup,
    moveTabToTabGroup,
    setTabGroupCollapsed,
    ungroupTabs,
    closeTabGroup,
    closeOtherTabGroups,
    setTabColor,
    setTabGroupColor,
    setTabLocked,
    setTabGroupLocked,
    setTabProtection,
    setTabGroupProtection,
    unlockProtection: (targetId: string) => {
      unlockedProtectionIds.add(targetId)
    },
    lockProtection: (targetId: string) => {
      unlockedProtectionIds.delete(targetId)
    },
    isProtectionUnlocked: (targetId: string) => unlockedProtectionIds.has(targetId),
    setActiveActivity,
    setActiveSidebarView,
    reorderActivity,
    setActivityRailLocation,
    setCommandBarLocation,
    setCommandBarVisible,
    setActiveGroup,
    focusNextGroup: () => focusRelativeGroup(1),
    focusPreviousGroup: () => focusRelativeGroup(-1),
    navigateBack: () => navigate('back'),
    navigateForward: () => navigate('forward'),
    splitActiveTabRight: () => splitActiveTab('horizontal'),
    splitActiveTabDown: () => splitActiveTab('vertical'),
    moveTabToGroup,
    setSplitRatios,
    setSidebarSize,
    setSidebarCollapsed,
    setInspectorSize,
    setInspectorCollapsed,
    setBottomPanelOpen,
    setBottomPanelHeight,
    setActiveBottomPanelView,
    setCommandPaletteOpen: (open: boolean) => {
      state.commandPaletteOpen = open
      state.commandBarFocused = open
    },
    setCommandBarFocused: (focused: boolean) => {
      state.commandBarFocused = focused
    },
    persist,
    restore,
    tabs: tabsService,
  }
}

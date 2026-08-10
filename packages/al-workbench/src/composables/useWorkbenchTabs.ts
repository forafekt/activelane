import { computed } from 'vue'
import type { WorkbenchTab, WorkbenchTabColorId } from '../core/workbench/contributions'
import type { WorkbenchTabGroupNode, WorkbenchTabRailGroup } from '../core/workbench/shell'

import { useWorkbenchRuntime } from './useWorkbenchRuntime'

export function useWorkbenchTabs(group: WorkbenchTabGroupNode) {
  const runtime = useWorkbenchRuntime()

  const activeTab = computed(
    () => group.tabs.find((tab) => tab.id === group.activeTabId) ?? group.tabs[0] ?? null,
  )

  const pinnedTabs = computed(() => group.tabs.filter((tab) => tab.pinned))
  const unpinnedTabs = computed(() => group.tabs.filter((tab) => !tab.pinned))
  const tabGroups = computed(() => [...(group.tabGroups ?? [])].sort((a, b) => a.order - b.order))

  const ungroupedTabs = computed(() => group.tabs.filter((tab) => !tab.tabGroupId))

  function tabsForGroup(tabGroup: WorkbenchTabRailGroup) {
    return group.tabs.filter((tab) => tab.tabGroupId === tabGroup.id)
  }

  function notify(title: string, message?: string, tone: 'info' | 'warning' | 'error' = 'info') {
    void runtime.host.capabilities.notify?.({ title, message, tone })
  }

  function tabGroupForTab(tab: WorkbenchTab) {
    return tab.tabGroupId ? group.tabGroups.find((item) => item.id === tab.tabGroupId) : undefined
  }

  function isProtectionLocked(tab: WorkbenchTab) {
    if (tab.protection && !runtime.workbench.isProtectionUnlocked(tab.id)) return true
    const tabGroup = tabGroupForTab(tab)
    return Boolean(tabGroup?.protection && !runtime.workbench.isProtectionUnlocked(tabGroup.id))
  }

  function isCloseBlocked(tab: WorkbenchTab) {
    return tab.closable === false || tab.locked || Boolean(tabGroupForTab(tab)?.locked)
  }

  function explainBlocked(tab: WorkbenchTab, action: string) {
    if (tab.locked) {
      notify('Tab is locked', `Unlock "${tab.title}" before ${action}.`, 'warning')
      return true
    }
    const tabGroup = tabGroupForTab(tab)
    if (tabGroup?.locked) {
      notify('Group is locked', `Unlock "${tabGroup.name}" before ${action}.`, 'warning')
      return true
    }
    return false
  }

  function explainProtected(tab: WorkbenchTab, action: string) {
    if (!isProtectionLocked(tab)) return false
    notify('Tab is protected', `Unlock "${tab.title}" before ${action}.`, 'warning')
    return true
  }

  function activate(tabId: string) {
    const tab = group.tabs.find((item) => item.id === tabId)
    if (tab && explainProtected(tab, 'opening it')) return
    runtime.workbench.activateTab(tabId, group.id)
    void runtime.workbench.persist()
  }

  function close(tabId: string) {
    const tab = group.tabs.find((item) => item.id === tabId)
    if (tab && (explainBlocked(tab, 'closing it') || explainProtected(tab, 'closing it'))) return
    runtime.workbench.closeTab(tabId, group.id)
    void runtime.workbench.persist()
  }

  function closeMany(tabs: WorkbenchTab[]) {
    const skipped = tabs.filter((tab) => isCloseBlocked(tab) || isProtectionLocked(tab))
    runtime.workbench.closeTabs(
      tabs.filter((tab) => !isCloseBlocked(tab) && !isProtectionLocked(tab)).map((tab) => tab.id),
      group.id,
    )
    if (skipped.length) {
      notify(
        'Some tabs were kept open',
        `${skipped.length} locked or protected tab${skipped.length === 1 ? '' : 's'} were skipped.`,
        'warning',
      )
    }
    void runtime.workbench.persist()
  }

  function reorder(tabId: string, targetTabId: string) {
    const tab = group.tabs.find((item) => item.id === tabId)
    if (tab && (explainBlocked(tab, 'moving it') || explainProtected(tab, 'moving it'))) return
    runtime.workbench.reorderTab(tabId, targetTabId, group.id)
    void runtime.workbench.persist()
  }

  function persistPreview(tabId: string) {
    runtime.workbench.persistPreviewTab(tabId, group.id)
    void runtime.workbench.persist()
  }

  function markEngaged(tabId: string) {
    runtime.workbench.markTabEngaged(tabId, group.id)
    void runtime.workbench.persist()
  }

  function setPinned(tabId: string, pinned: boolean) {
    runtime.workbench.setTabPinned(tabId, pinned, group.id)
    void runtime.workbench.persist()
  }

  function createGroup(name: string, tabIds: string[] = []) {
    const tabGroup = runtime.workbench.createTabGroup(name, group.id, tabIds)
    void runtime.workbench.persist()
    return tabGroup
  }

  function renameGroup(tabGroupId: string, name: string) {
    runtime.workbench.renameTabGroup(tabGroupId, name, group.id)
    void runtime.workbench.persist()
  }

  function moveToGroup(tabId: string, tabGroupId: string | null) {
    const tab = group.tabs.find((item) => item.id === tabId)
    if (tab && (explainBlocked(tab, 'moving it') || explainProtected(tab, 'moving it'))) return
    runtime.workbench.moveTabToTabGroup(tabId, tabGroupId, group.id)
    void runtime.workbench.persist()
  }

  function setGroupCollapsed(tabGroupId: string, collapsed: boolean) {
    runtime.workbench.setTabGroupCollapsed(tabGroupId, collapsed, group.id)
    void runtime.workbench.persist()
  }

  function setColor(tabId: string, color: WorkbenchTabColorId | undefined) {
    runtime.workbench.setTabColor(tabId, color, group.id)
    void runtime.workbench.persist()
  }

  function setLocked(tabId: string, locked: boolean) {
    runtime.workbench.setTabLocked(tabId, locked, group.id)
    void runtime.workbench.persist()
  }

  return {
    activeTab,
    pinnedTabs,
    unpinnedTabs,
    tabGroups,
    ungroupedTabs,
    tabsForGroup,
    tabGroupForTab,
    isProtectionLocked,
    isCloseBlocked,
    notify,
    activate,
    close,
    closeMany,
    reorder,
    persistPreview,
    markEngaged,
    setPinned,
    createGroup,
    renameGroup,
    moveToGroup,
    setGroupCollapsed,
    setColor,
    setLocked,
  }
}

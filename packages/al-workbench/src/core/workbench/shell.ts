import type { Disposable } from '../shared/types'
import type {
  OpenWorkbenchTabOptions,
  WorkbenchActionContribution,
  WorkbenchActivityContribution,
  WorkbenchActivityRailLocation,
  WorkbenchApplicationContribution,
  WorkbenchBottomPaneContribution,
  WorkbenchCommandBarLocation,
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
  WorkbenchGlobalMenuContribution,
  WorkbenchInspectorPanelContribution,
  WorkbenchLayoutPreference,
  WorkbenchMenuItemContribution,
  WorkbenchOpenTabBehavior,
  WorkbenchPartContribution,
  WorkbenchSettingsPageContribution,
  WorkbenchSidebarViewContribution,
  WorkbenchStatusBarItemContribution,
  WorkbenchTab,
  WorkbenchTabColorId,
  WorkbenchTabProtectionMetadata,
  WorkbenchTabRendererContribution,
} from './contributions'
import type { FileOpenerContribution } from './fileOpeners'
import type { WorkbenchSettingsContribution } from './settings'
import type { WorkbenchTabSurfaceContribution } from './surfaces'
import type {
  WorkbenchRegisteredTabAction,
  WorkbenchRegisteredTabGroupAction,
} from './tabWorkspace'

export type WorkbenchSplitOrientation = 'horizontal' | 'vertical'

export interface WorkbenchTabGroupNode {
  kind: 'group'
  id: string
  tabs: WorkbenchTab[]
  tabGroups: WorkbenchTabRailGroup[]
  activeTabId: string | null
}

export interface WorkbenchTabRailGroup {
  id: string
  name: string
  color?: WorkbenchTabColorId
  collapsed: boolean
  locked?: boolean
  protection?: WorkbenchTabProtectionMetadata | null
  indicators?: import('./tabWorkspace').WorkbenchTabIndicator[]
  order: number
}

export interface WorkbenchSplitNode {
  kind: 'split'
  id: string
  orientation: WorkbenchSplitOrientation
  ratios: number[]
  children: WorkbenchLayoutNode[]
}

export type WorkbenchLayoutNode = WorkbenchTabGroupNode | WorkbenchSplitNode

export interface WorkbenchPaneState {
  collapsed: boolean
  size: number
  minSize: number
  minExpandedSize: number
  lastExpandedSize: number
  collapseThreshold: number
  maxSize?: number
}

export interface WorkbenchBottomPanelState {
  open: boolean
  height: number
  activeViewId: string | null
}

export interface WorkbenchShellState {
  hostMode: import('../host/types').WorkbenchHostMode
  activeActivityId: string | null
  activeSidebarViewId: string | null
  layoutPreference: WorkbenchLayoutPreference
  sidebar: WorkbenchPaneState
  inspector: WorkbenchPaneState
  bottomPanel: WorkbenchBottomPanelState
  activeGroupId: string
  layout: WorkbenchLayoutNode
  commandPaletteOpen: boolean
  commandBarFocused: boolean
  navigation: {
    back: string[]
    forward: string[]
  }
}

export interface WorkbenchShellApi {
  ui: import('./ui').WorkbenchUI
  state: WorkbenchShellState
  getActiveTab: () => WorkbenchTab | null
  openTab: (input: OpenWorkbenchTabOptions, behavior?: WorkbenchOpenTabBehavior) => WorkbenchTab
  closeTab: (tabId: string, groupId?: string) => void
  closeTabs: (tabIds: string[], groupId?: string) => void
  closeActiveTab: () => void
  activateTab: (tabId: string, groupId?: string) => void
  markTabDirty: (tabId: string, dirty: boolean, groupId?: string) => void
  pinTab: (tabId: string, groupId?: string) => void
  unpinTab: (tabId: string, groupId?: string) => void
  setTabPinned: (tabId: string, pinned: boolean, groupId?: string) => void
  setTabTitle: (tabId: string, title: string, groupId?: string) => void
  persistPreviewTab: (tabId: string, groupId?: string) => void
  replacePreviewTab: (
    input: OpenWorkbenchTabOptions,
    behavior?: WorkbenchOpenTabBehavior,
  ) => WorkbenchTab
  markTabEngaged: (tabId: string, groupId?: string) => void
  reorderTab: (tabId: string, targetTabId: string, groupId?: string) => void
  duplicateTab: (tabId: string, groupId?: string) => WorkbenchTab | null
  reopenClosedTab: (groupId?: string) => WorkbenchTab | null
  createTabGroup: (name: string, groupId?: string, tabIds?: string[]) => WorkbenchTabRailGroup
  renameTabGroup: (tabGroupId: string, name: string, groupId?: string) => void
  reorderTabGroup: (tabGroupId: string, targetTabGroupId: string, groupId?: string) => void
  moveTabToTabGroup: (tabId: string, tabGroupId: string | null, groupId?: string) => void
  setTabGroupCollapsed: (tabGroupId: string, collapsed: boolean, groupId?: string) => void
  ungroupTabs: (tabGroupId: string, groupId?: string) => void
  closeTabGroup: (tabGroupId: string, groupId?: string) => void
  closeOtherTabGroups: (tabGroupId: string, groupId?: string) => void
  setTabColor: (tabId: string, color: WorkbenchTabColorId | undefined, groupId?: string) => void
  setTabGroupColor: (
    tabGroupId: string,
    color: WorkbenchTabColorId | undefined,
    groupId?: string,
  ) => void
  setTabLocked: (tabId: string, locked: boolean, groupId?: string) => void
  setTabGroupLocked: (tabGroupId: string, locked: boolean, groupId?: string) => void
  setTabProtection: (
    tabId: string,
    protection: WorkbenchTabProtectionMetadata | null,
    groupId?: string,
  ) => void
  setTabGroupProtection: (
    tabGroupId: string,
    protection: WorkbenchTabProtectionMetadata | null,
    groupId?: string,
  ) => void
  unlockProtection: (targetId: string) => void
  lockProtection: (targetId: string) => void
  isProtectionUnlocked: (targetId: string) => boolean
  setActiveActivity: (activityId: string) => void
  setActiveSidebarView: (viewId: string | null) => void
  reorderActivity: (activityId: string, targetActivityId: string) => void
  setActivityRailLocation: (location: WorkbenchActivityRailLocation) => void
  setCommandBarLocation: (location: WorkbenchCommandBarLocation) => void
  setCommandBarVisible: (visible: boolean) => void
  setActiveGroup: (groupId: string) => void
  focusNextGroup: () => string | null
  focusPreviousGroup: () => string | null
  navigateBack: () => WorkbenchTab | null
  navigateForward: () => WorkbenchTab | null
  splitActiveTabRight: () => WorkbenchTab | null
  splitActiveTabDown: () => WorkbenchTab | null
  moveTabToGroup: (tabId: string, targetGroupId: string) => void
  setSplitRatios: (splitId: string, ratios: number[]) => void
  setSidebarSize: (size: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setInspectorSize: (size: number) => void
  setInspectorCollapsed: (collapsed: boolean) => void
  setBottomPanelOpen: (open: boolean) => void
  setBottomPanelHeight: (height: number) => void
  setActiveBottomPanelView: (viewId: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  setCommandBarFocused: (focused: boolean) => void
  restore: (state: Partial<WorkbenchShellState>) => void
  persist: () => Promise<void>
  tabs: import('./tabWorkspace').WorkbenchTabWorkspaceServices
}

export interface WorkbenchRegisteredContributions {
  parts: WorkbenchPartContribution[]
  statusBar: WorkbenchStatusBarItemContribution[]
  globalMenus: WorkbenchGlobalMenuContribution[]
  activityRail: WorkbenchActivityContribution[]
  apps: WorkbenchApplicationContribution[]
  sidebarViews: WorkbenchSidebarViewContribution[]
  commands: WorkbenchCommandContribution[]
  commandPalette: WorkbenchCommandPaletteContribution[]
  tabRenderers: WorkbenchTabRendererContribution[]
  tabSurfaces: WorkbenchTabSurfaceContribution[]
  tabToolbarActions: WorkbenchActionContribution[]
  tabContextMenu: WorkbenchMenuItemContribution[]
  bottomPaneViews: WorkbenchBottomPaneContribution[]
  inspectorPanels: WorkbenchInspectorPanelContribution[]
  settingsPages: WorkbenchSettingsPageContribution[]
  menus: WorkbenchMenuItemContribution[]
  fileOpeners: FileOpenerContribution[]
}

export interface WorkbenchContributionRegistrar {
  parts: (...items: WorkbenchPartContribution[]) => Disposable
  statusBar: (...items: WorkbenchStatusBarItemContribution[]) => Disposable
  globalMenus: (...items: WorkbenchGlobalMenuContribution[]) => Disposable
  activityRail: (...items: WorkbenchActivityContribution[]) => Disposable
  apps: (...items: WorkbenchApplicationContribution[]) => Disposable
  sidebarViews: (...items: WorkbenchSidebarViewContribution[]) => Disposable
  commands: (...items: WorkbenchCommandContribution[]) => Disposable
  commandPalette: (...items: WorkbenchCommandPaletteContribution[]) => Disposable
  tabRenderers: (...items: WorkbenchTabRendererContribution[]) => Disposable
  tabSurfaces: (...items: WorkbenchTabSurfaceContribution[]) => Disposable
  tabToolbarActions: (...items: WorkbenchActionContribution[]) => Disposable
  tabContextMenu: (...items: WorkbenchMenuItemContribution[]) => Disposable
  bottomPaneViews: (...items: WorkbenchBottomPaneContribution[]) => Disposable
  inspectorPanels: (...items: WorkbenchInspectorPanelContribution[]) => Disposable
  settingsPages: (...items: WorkbenchSettingsPageContribution[]) => Disposable
  settings: (contribution: WorkbenchSettingsContribution) => Disposable
  menus: (...items: WorkbenchMenuItemContribution[]) => Disposable
  fileOpeners: (...items: FileOpenerContribution[]) => Disposable
  tabActions: (...items: WorkbenchRegisteredTabAction[]) => Disposable
  tabGroupActions: (...items: WorkbenchRegisteredTabGroupAction[]) => Disposable
}

export const WORKBENCH_SHELL_STORAGE_KEY = 'shell-state'

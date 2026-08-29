import type { IconReference } from '@activelane/icons'
import type {
  WorkbenchApplicationMenuId,
  WorkbenchMenuItemKind,
  WorkbenchNativeMenuRole,
} from '../menus/menuContracts'
import type { MaybePromise } from '../shared/types'
import type { WorkbenchSurfaceDescriptor, WorkbenchSurfaceResolver } from './surfaces'
import type { WorkbenchComponent } from './ui'

export type WorkbenchMenuLocation =
  | 'global/app'
  | 'global/activity'
  | 'global/menuBar'
  | 'activity/context'
  | 'command-palette'
  | 'tab/context'
  | 'tab/toolbar'
  | 'sidebar/header'
  | 'sidebar/context'
  | 'inspector/header'
  | 'settings/page'
  | 'marketplace/item'

export interface WorkbenchContributionBase {
  id: string
  title: string
  ownerExtensionId?: string
  order?: number
  when?: string
}

export interface WorkbenchBadge {
  value: string | number
  tone?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export type WorkbenchPart =
  | 'topBar'
  | 'activityRail'
  | 'primarySideBar'
  | 'secondarySideBar'
  | 'editor'
  | 'bottomPanel'
  | 'statusBar'

export type WorkbenchZone = 'top' | 'left' | 'center' | 'right' | 'bottom' | 'status'

export type WorkbenchActivityRailLocation = 'left' | 'right' | 'top'

export type WorkbenchCommandBarLocation = 'workbench-top' | 'titlebar'

export interface WorkbenchPartContribution extends WorkbenchContributionBase {
  part: WorkbenchPart
  zone: WorkbenchZone
  component?: WorkbenchComponent
  defaultVisible?: boolean
  movable?: boolean
}

export interface WorkbenchLayoutPreference {
  activityRailLocation: WorkbenchActivityRailLocation
  activityOrder: string[]
  commandBarLocation: WorkbenchCommandBarLocation
  commandBarVisible: boolean
}

export type WorkbenchGlobalMenuPlacement = 'topBar' | 'activityLauncher'

export interface WorkbenchGlobalMenuContribution extends WorkbenchContributionBase {
  menuId: string
  placement?: WorkbenchGlobalMenuPlacement[]
}

export type WorkbenchContributionZoneId =
  | 'workbench.statusBar'
  | 'workbench.activityRail'
  | 'workbench.panel.left'
  | 'workbench.panel.right'
  | 'workbench.panel.bottom'
  | 'workbench.tabs'
  | 'workbench.tabRail'
  | 'workbench.menu.global'
  | 'workbench.menu.application'
  | 'workbench.commands'

export type WorkbenchStatusBarAlignment = 'left' | 'right'

export interface WorkbenchStatusBarItemContribution extends WorkbenchContributionBase {
  alignment?: WorkbenchStatusBarAlignment
  icon?: WorkbenchComponent | IconReference
  commandId?: string
  label?: string
  tooltip?: string
  enabled?: boolean
  visible?: boolean
}

export interface WorkbenchActivityContribution extends WorkbenchContributionBase {
  icon?: WorkbenchComponent | IconReference
  badge?: WorkbenchBadge
  defaultSidebarViewId?: string
}

export type WorkbenchApplicationLaunchType = 'tab' | 'command' | 'activity' | 'external-url'

export interface WorkbenchApplicationTabLaunch {
  type: 'tab'
  tabId?: string
  tabKind?: string
  kind?: string
  title?: string
  surfaceId?: string
  component?: string
  input?: WorkbenchTabInput
  pinned?: boolean
  preview?: boolean
}

export interface WorkbenchApplicationCommandLaunch {
  type: 'command'
  commandId: string
}

export interface WorkbenchApplicationActivityLaunch {
  type: 'activity'
  activityId: string
  sidebarViewId?: string
}

export interface WorkbenchApplicationExternalUrlLaunch {
  type: 'external-url'
  url: string
}

export type WorkbenchApplicationLaunch =
  | WorkbenchApplicationTabLaunch
  | WorkbenchApplicationCommandLaunch
  | WorkbenchApplicationActivityLaunch
  | WorkbenchApplicationExternalUrlLaunch

export interface WorkbenchApplicationContribution extends WorkbenchContributionBase {
  name: string
  description?: string
  category?: string
  icon?: WorkbenchComponent | IconReference
  keywords?: string[]
  launch: WorkbenchApplicationLaunch
}

export interface WorkbenchActionContribution extends WorkbenchContributionBase {
  icon?: WorkbenchComponent | IconReference
  commandId: string
}

export interface WorkbenchSidebarViewContribution extends WorkbenchContributionBase {
  activityId: string
  component: WorkbenchComponent
  actions?: WorkbenchActionContribution[]
  footerComponent?: WorkbenchComponent
}

export interface WorkbenchBottomPaneContribution extends WorkbenchContributionBase {
  icon?: WorkbenchComponent | IconReference
  component: WorkbenchComponent
  placement?: 'bottomPane'
}

export interface WorkbenchCommandExecutionContext {
  runtime: import('../runtime/types').WorkbenchRuntimeApi
  host: import('../host/types').WorkbenchHostAdapter
  workbench: import('./shell').WorkbenchShellApi
}

export interface WorkbenchCommandContribution extends WorkbenchContributionBase {
  icon?: WorkbenchComponent | IconReference
  shortcut?: string
  secondaryShortcuts?: string[]
  category?: string
  description?: string
  enabled?: boolean
  visible?: boolean
  run?: (context: WorkbenchCommandExecutionContext) => MaybePromise<void>
}

export interface WorkbenchCommandPaletteContribution extends WorkbenchContributionBase {
  commandId: string
  icon?: WorkbenchComponent | IconReference
  keywords?: string[]
  category?: string
  description?: string
  enabled?: boolean
  visible?: boolean
}

export type WorkbenchTabLifecycle = 'preview' | 'persistent' | 'pinned' | 'dirty'

export type WorkbenchOpenTabMode = 'preview' | 'persistent' | 'pinned'

export type WorkbenchTabColorId =
  | 'default'
  | 'blue'
  | 'green'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate'

export interface WorkbenchTabProtectionMetadata {
  algorithm: 'PBKDF2-SHA-256'
  salt: string
  hash: string
  iterations: number
  hint?: string
  createdAt: number
}

export interface WorkbenchTabContext {
  tab: WorkbenchTab
  groupId: string
  tabKind: string
  ownerExtensionId?: string
  pinned: boolean
  dirty: boolean
  lifecycle: WorkbenchTabLifecycle
  preview: boolean
  closable: boolean
  capabilities: string[]
}

export interface WorkbenchTabInput {
  [key: string]: unknown
}

export interface WorkbenchTab extends WorkbenchContributionBase {
  kind: string
  icon?: WorkbenchComponent | IconReference
  surfaceId?: string
  surface?: WorkbenchSurfaceDescriptor
  closable: boolean
  pinned: boolean
  preview: boolean
  lifecycle: WorkbenchTabLifecycle
  dirty: boolean
  groupId: string
  tabGroupId?: string | null
  color?: WorkbenchTabColorId
  locked?: boolean
  protection?: WorkbenchTabProtectionMetadata | null
  input?: WorkbenchTabInput
  resource?: string
  viewInstanceId?: string
  capabilities?: string[]
  indicators?: import('./tabWorkspace').WorkbenchTabIndicator[]
  hibernation?: import('./tabWorkspace').WorkbenchTabHibernationMetadata
}

export interface OpenWorkbenchTabOptions {
  id?: string
  kind: string
  title: string
  icon?: WorkbenchComponent | IconReference
  surfaceId?: string
  surface?: WorkbenchSurfaceDescriptor
  closable?: boolean
  pinned?: boolean
  preview?: boolean
  lifecycle?: WorkbenchTabLifecycle
  dirty?: boolean
  groupId?: string
  tabGroupId?: string | null
  color?: WorkbenchTabColorId
  locked?: boolean
  protection?: WorkbenchTabProtectionMetadata | null
  input?: WorkbenchTabInput
  resource?: string
  viewInstanceId?: string
  ownerExtensionId?: string
  capabilities?: string[]
  indicators?: import('./tabWorkspace').WorkbenchTabIndicator[]
  hibernation?: import('./tabWorkspace').WorkbenchTabHibernationMetadata
}

export interface WorkbenchOpenTabBehavior {
  mode?: WorkbenchOpenTabMode
  replacePreview?: boolean
  activate?: boolean
  source?: 'single-click' | 'double-click' | 'navigation' | 'command' | 'restore' | 'api'
}

export interface WorkbenchTabRendererContribution extends WorkbenchContributionBase {
  tabKind: string
  component?: WorkbenchComponent
  surface?: WorkbenchSurfaceDescriptor | WorkbenchSurfaceResolver
}

export interface WorkbenchInspectorPanelContribution extends WorkbenchContributionBase {
  component: WorkbenchComponent
  tabKinds?: string[]
}

export interface WorkbenchMenuItemContribution extends WorkbenchContributionBase {
  kind?: WorkbenchMenuItemKind
  location: WorkbenchMenuLocation | string
  menuId?: WorkbenchApplicationMenuId
  submenu?: WorkbenchApplicationMenuId
  commandId?: string
  group?: string
  icon?: WorkbenchComponent | IconReference
  shortcut?: string
  nativeRole?: WorkbenchNativeMenuRole
  enablement?: string
  checked?: boolean | string
  contexts?: {
    tabKinds?: string[]
    ownerExtensionIds?: string[]
    pinned?: boolean
    dirty?: boolean
    preview?: boolean
    lifecycle?: WorkbenchTabLifecycle[]
    capabilities?: string[]
  }
}

export type WorkbenchTabAction = WorkbenchMenuItemContribution

export interface WorkbenchSettingsPageContribution extends WorkbenchContributionBase {
  component: WorkbenchComponent
  icon?: WorkbenchComponent | IconReference
  section?: string
}

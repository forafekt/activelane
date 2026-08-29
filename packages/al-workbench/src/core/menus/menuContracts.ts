import type { IconReference } from '@activelane/icons'
import type { WorkbenchComponent } from '../workbench/ui'

export type ActiveLaneRuntimePlatform = 'web' | 'desktop' | 'browser-extension'

export type ActiveLaneOperatingSystem = 'macos' | 'windows' | 'linux' | 'unknown'

export type WorkbenchMenuPlacement =
  | 'native/app-menu'
  | 'workbench/top-bar'
  | 'activity-launcher'
  | 'command-palette'
  | 'tab/context'

export const WorkbenchApplicationMenuId = {
  App: 'app',
  File: 'file',
  Edit: 'edit',
  Selection: 'selection',
  View: 'view',
  Go: 'go',
  Run: 'run',
  Terminal: 'terminal',
  Window: 'window',
  Help: 'help',
} as const

export type WorkbenchApplicationMenuId =
  | (typeof WorkbenchApplicationMenuId)[keyof typeof WorkbenchApplicationMenuId]
  | (string & {})

export type WorkbenchMenuItemKind = 'command' | 'separator' | 'submenu'

export type WorkbenchNativeMenuRole =
  | 'about'
  | 'services'
  | 'hide'
  | 'hideOthers'
  | 'unhide'
  | 'quit'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'pasteAndMatchStyle'
  | 'delete'
  | 'selectAll'
  | 'reload'
  | 'forceReload'
  | 'toggleDevTools'
  | 'resetZoom'
  | 'zoomIn'
  | 'zoomOut'
  | 'togglefullscreen'
  | 'minimize'
  | 'close'
  | 'front'
  | 'window'
  | 'help'

export interface WorkbenchMenuContributionBase {
  id: string
  title?: string
  label?: string
  ownerExtensionId?: string
  group?: string
  order?: number
  when?: string
  enablement?: string
  checked?: boolean | string
}

export interface WorkbenchApplicationMenuContribution extends WorkbenchMenuContributionBase {
  menuId: WorkbenchApplicationMenuId
  placement?: Array<'topBar' | 'activityLauncher' | WorkbenchMenuPlacement>
}

export interface WorkbenchMenuCommandContribution extends WorkbenchMenuContributionBase {
  kind?: 'command'
  menuId?: WorkbenchApplicationMenuId
  location?: string
  commandId: string
  icon?: WorkbenchComponent | IconReference
  shortcut?: string
  secondaryShortcuts?: string[]
  nativeRole?: WorkbenchNativeMenuRole
}

export interface WorkbenchMenuSeparatorContribution extends WorkbenchMenuContributionBase {
  kind: 'separator'
  menuId?: WorkbenchApplicationMenuId
  location?: string
}

export interface WorkbenchMenuSubmenuContribution extends WorkbenchMenuContributionBase {
  kind: 'submenu'
  menuId?: WorkbenchApplicationMenuId
  location?: string
  submenu: WorkbenchApplicationMenuId
}

export type WorkbenchMenuContribution =
  | WorkbenchMenuCommandContribution
  | WorkbenchMenuSeparatorContribution
  | WorkbenchMenuSubmenuContribution

export interface WorkbenchResolvedMenuCommandItem {
  kind: 'command'
  id: string
  label: string
  commandId: string
  enabled: boolean
  visible: boolean
  group?: string
  order: number
  icon?: WorkbenchComponent | IconReference
  shortcut?: string
  nativeRole?: WorkbenchNativeMenuRole
  checked?: boolean
}

export interface WorkbenchResolvedMenuSeparatorItem {
  kind: 'separator'
  id: string
  group?: string
  order: number
}

export interface WorkbenchResolvedMenuSubmenuItem {
  kind: 'submenu'
  id: string
  label: string
  menuId: WorkbenchApplicationMenuId
  group?: string
  order: number
  items: WorkbenchResolvedMenuItem[]
}

export type WorkbenchResolvedMenuItem =
  | WorkbenchResolvedMenuCommandItem
  | WorkbenchResolvedMenuSeparatorItem
  | WorkbenchResolvedMenuSubmenuItem

export interface WorkbenchResolvedMenuGroup {
  id: string
  label: string
  menuId: WorkbenchApplicationMenuId
  order: number
  items: WorkbenchResolvedMenuItem[]
}

export interface WorkbenchMenuResolveContext {
  platform: ActiveLaneRuntimePlatform
  os: ActiveLaneOperatingSystem
  placement: WorkbenchMenuPlacement
  [key: string]: boolean | number | string | null | undefined
}

export interface WorkbenchNativeApplicationMenuSnapshot {
  platform: 'desktop'
  os: ActiveLaneOperatingSystem
  menus: WorkbenchResolvedMenuGroup[]
}

export interface WorkbenchMenuRegistry {
  resolveApplicationMenus(context: WorkbenchMenuResolveContext): WorkbenchResolvedMenuGroup[]
}

export * from './context'

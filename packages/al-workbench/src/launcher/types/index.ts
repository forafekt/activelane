import type {
  WorkbenchApplicationContribution,
  WorkbenchApplicationRegistry,
} from '@activelane/workbench-api'
import type { InjectionKey } from 'vue'

export interface LauncherWorkspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface LauncherWorkspaceService {
  workspaces: LauncherWorkspace[]
  currentWorkspaceId: string
  getCurrentWorkspace: () => LauncherWorkspace | undefined
  switchWorkspace: (workspaceId: string) => Promise<void>
  createWorkspace: (name?: string) => Promise<LauncherWorkspace>
}

export interface LauncherSearchResult {
  app: WorkbenchApplicationContribution
  score: number
  matches: string[]
}

export interface ApplicationRegistryService extends WorkbenchApplicationRegistry {
  open: boolean
  query: string
  selectedIndex: number
  getPinnedApps: () => WorkbenchApplicationContribution[]
  getRecentApps: () => WorkbenchApplicationContribution[]
  getCategories: () => Array<{ name: string; apps: WorkbenchApplicationContribution[] }>
  isPinned: (id: string) => boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  setQuery: (query: string) => void
  moveSelection: (delta: number) => void
  workspace: LauncherWorkspaceService
}

export const LAUNCHER_SERVICE_SYMBOL: InjectionKey<ApplicationRegistryService> = Symbol(
  'ActiveLaneLauncherService',
)

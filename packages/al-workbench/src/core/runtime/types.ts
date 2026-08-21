import type { ActiveLaneCapabilityService } from '../capabilities/types'
import type { ExplorerRuntime } from '../explorer/types'
import type { WorkbenchEntitlementService } from '../entitlements/types'
import type {
  InstalledExtensionRecord,
  WorkbenchExtensionCatalogEntry,
  WorkbenchRuntimeExtensionRecord,
  WorkbenchSurfaceError,
} from '../extensions/types'
import type { WorkbenchHostAdapter } from '../host/types'
import type { ActiveLaneServerRuntime, ActiveLaneServerRuntimeOptions } from '../serverRuntime'
import type { WorkbenchCommandSearchService } from '../workbench/commands'
import type { WorkbenchApplicationContribution } from '../workbench/contributions'
import type { FileOpenerService } from '../workbench/fileOpeners'
import type { WorkbenchSettingsService } from '../workbench/settings'
import type {
  WorkbenchRegisteredContributions,
  WorkbenchShellApi,
  WorkbenchShellState,
} from '../workbench/shell'
import type { WorkbenchThemeService } from '../workbench/themes'
import type { ActiveLaneRuntimeContext } from './context'
import type { WorkbenchReactivityAdapter } from './reactivity'

export interface WorkbenchCommandService {
  execute: (commandId: string) => Promise<void>
  search: WorkbenchCommandSearchService
}

export interface ActiveLaneHostRuntime extends WorkbenchHostAdapter {
  server: ActiveLaneServerRuntime
}

export interface WorkbenchApplicationRegistry {
  getApps: () => WorkbenchApplicationContribution[]
  getApp: (id: string) => WorkbenchApplicationContribution | undefined
  searchApps: (query: string) => WorkbenchApplicationContribution[]
  launchApp: (id: string) => Promise<void>
  pinApp: (id: string) => Promise<void>
  unpinApp: (id: string) => Promise<void>
  recordRecentApp: (id: string) => Promise<void>
}

export interface WorkbenchRuntimeApi {
  context: ActiveLaneRuntimeContext
  host: ActiveLaneHostRuntime
  workbench: WorkbenchShellApi
  themes: WorkbenchThemeService
  settings: WorkbenchSettingsService
  fileOpeners: FileOpenerService
  capabilities: ActiveLaneCapabilityService
  explorer: ExplorerRuntime
  entitlements: WorkbenchEntitlementService
  registry: WorkbenchRegisteredContributions
  extensions: {
    records: WorkbenchRuntimeExtensionRecord[]
    discovered: WorkbenchExtensionCatalogEntry[]
    install: (extensionId: string, version?: string, registryId?: string) => Promise<void>
    installFromPackage: (packageBytes: ArrayBuffer | Uint8Array) => Promise<void>
    uninstall: (extensionId: string) => Promise<void>
    enable: (extensionId: string) => Promise<void>
    disable: (extensionId: string) => Promise<void>
    listInstalled: () => Promise<InstalledExtensionRecord[]>
    activate: (extensionId: string) => Promise<void>
    deactivate: (extensionId: string) => Promise<void>
    reportSurfaceError: (
      extensionId: string,
      error: {
        surface: WorkbenchSurfaceError['surface']
        contributionId?: string
        message: string
      },
    ) => void
    clearSurfaceErrors: (extensionId: string, contributionId?: string) => void
    getRecord: (extensionId: string) => WorkbenchRuntimeExtensionRecord | undefined
  }
  commands: WorkbenchCommandService
  applications?: WorkbenchApplicationRegistry
  dispose: () => Promise<void>
}

export interface ActiveLaneRuntime extends WorkbenchRuntimeApi {}

export interface CreateWorkbenchRuntimeOptions {
  host: WorkbenchHostAdapter
  extensions?: WorkbenchExtensionCatalogEntry[]
  installedExtensions?: InstalledExtensionRecord[]
  initialState?: Partial<WorkbenchShellState>
  runtimeId?: string
  appVersion?: string
  reactivity?: Partial<WorkbenchReactivityAdapter>
  ui?: Partial<WorkbenchShellApi['ui']>
  server?: Partial<Pick<ActiveLaneServerRuntimeOptions, 'launcher' | 'now'>>
}

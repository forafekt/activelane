import type { InstalledExtensionRecord, WorkbenchExtensionDefinition } from '../extensions/types'
import type { ActiveLaneHostKind } from '../runtime/context'
import type { ActiveLaneServerRuntime } from '../server'

export interface WorkbenchStorageScope {
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  remove: (key: string) => Promise<void>
}

export interface WorkbenchStorageAdapter {
  scope: (namespace: string) => WorkbenchStorageScope
}

export interface WorkbenchNotificationAction {
  id: string
  label: string
}

export interface WorkbenchNotificationOptions {
  title: string
  message?: string
  tone?: 'info' | 'success' | 'warning' | 'error'
  actions?: WorkbenchNotificationAction[]
}

export interface WorkbenchNotificationResult {
  actionId?: string
  dismissed?: boolean
}

export interface WorkbenchDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface WorkbenchFileHandle {
  name: string
  path?: string
  contents?: string
}

export interface WorkbenchFileSystemEntry {
  name: string
  path: string
  uri: string
  type: 'file' | 'directory' | 'symlink' | 'other'
  size?: number
  modifiedAt?: string
  hidden?: boolean
}

export interface WorkbenchHostCapabilities {
  config?: {
    apiBaseUrl?: string
  }
  terminalBridge?: {
    getBridge?: () => Promise<{ url: string; token: string } | null>
  }
  storage?: WorkbenchStorageAdapter
  notify?: (
    options: WorkbenchNotificationOptions,
  ) => Promise<WorkbenchNotificationResult | undefined>
  confirm?: (options: WorkbenchDialogOptions) => Promise<boolean>
  clipboard?: {
    readText?: () => Promise<string>
    writeText?: (value: string) => Promise<void>
  }
  files?: {
    open?: () => Promise<WorkbenchFileHandle | null>
    read?: (path: string) => Promise<WorkbenchFileHandle | null>
    openFolder?: () => Promise<string | undefined>
    openWorkspaceFile?: () => Promise<WorkbenchFileHandle | null>
    saveAs?: (payload: WorkbenchFileHandle) => Promise<WorkbenchFileHandle | null>
    save?: (payload: WorkbenchFileHandle) => Promise<void>
    workspaceRoot?: () => Promise<string | undefined>
    readDirectory?: (path?: string) => Promise<WorkbenchFileSystemEntry[]>
    openPath?: (path: string) => Promise<void>
    openWithSystemApp?: (path: string, appId: string) => Promise<void>
    listSystemFileOpeners?: (path: string) => Promise<
      Array<{
        id: string
        label: string
        description?: string
        appId?: string
        executablePath?: string
        priority?: number
      }>
    >
    revealInFileManager?: (path: string) => Promise<void>
  }
  alx?: {
    available: boolean
    run?: (input: ActiveLaneAlxRunRequest) => Promise<ActiveLaneAlxRunResult>
    selectDirectory?: () => Promise<string | undefined>
    selectPackage?: () => Promise<string | undefined>
  }
  network?: {
    fetch?: typeof fetch
  }
  extensions?: {
    listInstalled?: () => Promise<InstalledExtensionRecord[]>
    install?: (
      extensionId: string,
      version?: string,
    ) => Promise<InstalledExtensionRecord | undefined>
    installFromPackage?: (
      packageBytes: ArrayBuffer | Uint8Array,
    ) => Promise<InstalledExtensionRecord>
    uninstall?: (extensionId: string) => Promise<void>
    enable?: (extensionId: string) => Promise<InstalledExtensionRecord | undefined>
    disable?: (extensionId: string) => Promise<InstalledExtensionRecord | undefined>
    discover?: () => Promise<WorkbenchExtensionDefinition[]>
  }
}

export type ActiveLaneAlxCommand =
  | 'scaffold'
  | 'validate'
  | 'package'
  | 'publish'
  | 'install'
  | 'uninstall'
  | 'enable'
  | 'disable'
  | 'inspect'
  | 'list-installed'
  | 'list-local'
  | 'list-registry'
  | 'registry-list'
  | 'registry-add'
  | 'registry-export'
  | 'registry-import'
  | 'yank'
  | 'block'
  | 'run'

export interface ActiveLaneAlxRunRequest {
  command: ActiveLaneAlxCommand
  cwd?: string
  registryUrl?: string
  storeDir?: string
  extensionDir?: string
  manifestPath?: string
  packagePath?: string
  outDir?: string
  outFile?: string
  extensionId?: string
  version?: string
  search?: string
  dryRun?: boolean
  autoValidate?: boolean
  scaffold?: {
    directory: string
    id: string
    displayName: string
    description?: string
    publisher?: string
    name?: string
  }
  argv?: string[]
}

export interface ActiveLaneAlxLogEntry {
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export interface ActiveLaneAlxRunResult<T = unknown> {
  ok: boolean
  command: ActiveLaneAlxCommand
  startedAt: string
  completedAt: string
  logs: ActiveLaneAlxLogEntry[]
  data?: T
  error?: {
    message: string
    code?: string
    issues?: Array<{ path: string; message: string }>
  }
}

export type WorkbenchHostMode = 'compact' | 'standard' | 'native'

export interface WorkbenchHostAdapter {
  id: string
  kind: ActiveLaneHostKind
  label: string
  mode: WorkbenchHostMode
  server?: ActiveLaneServerRuntime
  capabilities: WorkbenchHostCapabilities
}

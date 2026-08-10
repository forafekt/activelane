import type { InstalledExtensionRecord, WorkbenchExtensionDefinition } from '../extensions/types'
import type { ActiveLaneHostKind } from '../runtime/context'
import type { ActiveLaneServerRuntime } from '../serverRuntime'

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
  lifecycle?: {
    closeWindow?: () => Promise<void>
  }
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

export type WorkbenchHostMode = 'compact' | 'standard' | 'native'

export interface WorkbenchHostAdapter {
  id: string
  kind: ActiveLaneHostKind
  label: string
  mode: WorkbenchHostMode
  server?: ActiveLaneServerRuntime
  capabilities: WorkbenchHostCapabilities
}

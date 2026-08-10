import type {
  ActiveLaneAlxRunResult,
  InstalledExtensionRecord,
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHostAdapter,
  WorkbenchNotificationOptions,
  WorkbenchStorageAdapter,
  WorkbenchStorageScope,
} from '../../index'

interface ElectronAPI {
  getPlatform: () => Promise<string>
  getTerminalBridge?: () => Promise<{ url: string; token: string } | null>
  showSaveDialog: () => Promise<{ canceled: boolean; filePath?: string } | null>
  showOpenDialog: () => Promise<{ canceled: boolean; filePaths?: string[] } | null>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}

interface ActiveLaneDesktopFilesApi {
  showOpenDialog: (
    mode?: 'file' | 'directory' | 'workspace',
  ) => Promise<{ canceled: boolean; filePaths?: string[] } | null>
  showSaveDialog: (payload?: WorkbenchFileHandle) => Promise<WorkbenchFileHandle | null>
  readFile?: (path: string) => Promise<WorkbenchFileHandle | null>
  writeFile?: (payload: WorkbenchFileHandle) => Promise<WorkbenchFileHandle>
  workspaceRoot?: () => Promise<string | undefined>
  readDirectory?: (path?: string) => Promise<WorkbenchFileSystemEntry[]>
  revealInFileManager?: (path: string) => Promise<void>
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export interface CreateDesktopWorkbenchHostOptions {
  id?: string
  kind?: 'desktop'
  label?: string
  storagePrefix?: string
  apiBaseUrl?: string
}

function createLocalStorageScope(prefix: string, namespace: string): WorkbenchStorageScope {
  const buildKey = (key: string) => `${prefix}:${namespace}:${key}`

  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(buildKey(key))
      return raw ? (JSON.parse(raw) as T) : undefined
    },
    async set<T>(key: string, value: T) {
      localStorage.setItem(buildKey(key), JSON.stringify(value))
    },
    async remove(key: string) {
      localStorage.removeItem(buildKey(key))
    },
  }
}

function createStorageAdapter(prefix: string): WorkbenchStorageAdapter {
  return {
    scope(namespace: string) {
      return createLocalStorageScope(prefix, namespace)
    },
  }
}

export function createDesktopWorkbenchHost(
  options: CreateDesktopWorkbenchHostOptions = {},
): WorkbenchHostAdapter {
  const prefix = options.storagePrefix ?? 'activelane.desktop'
  const runExtensionCommand = async (
    command: 'install' | 'uninstall' | 'enable' | 'disable' | 'list-installed',
    input: { extensionId?: string; version?: string } = {},
  ) => {
    const desktop = window as unknown as Window & {
      activeLaneDesktop?: {
        alx?: { run?: (payload: Record<string, unknown>) => Promise<ActiveLaneAlxRunResult> }
      }
    }
    if (!desktop.activeLaneDesktop?.alx?.run) {
      throw new Error('Desktop extension installation is unavailable.')
    }
    const result = (await desktop.activeLaneDesktop.alx.run({
      command,
      ...input,
      registryUrl: options.apiBaseUrl,
    })) as ActiveLaneAlxRunResult
    if (!result.ok) throw new Error(result.error?.message ?? `Extension ${command} failed.`)
    return result.data
  }

  return {
    id: options.id ?? 'desktop',
    kind: options.kind ?? 'desktop',
    label: options.label ?? 'Desktop App',
    mode: 'native',
    capabilities: {
      config: {
        apiBaseUrl: options.apiBaseUrl,
      },
      terminalBridge: {
        getBridge: async () => {
          const desktopApi = window as Window & {
            activeLaneDesktop?: {
              terminal?: {
                getBridge?: () => Promise<{ url: string; token: string } | null>
              }
            }
          }
          return desktopApi.activeLaneDesktop?.terminal?.getBridge?.() ?? null
        },
      },
      storage: createStorageAdapter(prefix),
      notify: async ({ title, message, tone }: WorkbenchNotificationOptions) => {
        const detail = message ? `${title}: ${message}` : title
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body: message })
          return undefined
        }
        const logger =
          tone === 'error' ? console.error : tone === 'warning' ? console.warn : console.info
        logger(detail)
        return undefined
      },
      confirm: async ({ title, message }: WorkbenchDialogOptions) => {
        console.warn(message ? `${title}: ${message}` : title)
        return false
      },
      clipboard: {
        readText: async () => navigator.clipboard.readText(),
        writeText: async (value: string) => navigator.clipboard.writeText(value),
      },
      network: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
      },
      extensions: {
        listInstalled: async () =>
          (await runExtensionCommand('list-installed')) as InstalledExtensionRecord[],
        install: async (extensionId, version) =>
          (await runExtensionCommand('install', {
            extensionId,
            version,
          })) as InstalledExtensionRecord,
        uninstall: async (extensionId) => {
          await runExtensionCommand('uninstall', { extensionId })
        },
        enable: async (extensionId) =>
          (await runExtensionCommand('enable', { extensionId })) as InstalledExtensionRecord,
        disable: async (extensionId) =>
          (await runExtensionCommand('disable', { extensionId })) as InstalledExtensionRecord,
      },
      files: {
        open: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          const result = await desktop.activeLaneDesktop?.files?.showOpenDialog?.('file')
          const path = result && !result.canceled ? result.filePaths?.[0] : undefined
          if (!path) return null
          return (
            (await desktop.activeLaneDesktop?.files?.readFile?.(path)) ?? {
              name: path.split(/[\\/]/).pop() || 'unknown',
              path,
            }
          )
        },
        read: async (path: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          return desktop.activeLaneDesktop?.files?.readFile?.(path) ?? null
        },
        openFolder: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          const result = await desktop.activeLaneDesktop?.files?.showOpenDialog?.('directory')
          return result && !result.canceled ? result.filePaths?.[0] : undefined
        },
        openWorkspaceFile: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          const result = await desktop.activeLaneDesktop?.files?.showOpenDialog?.('workspace')
          const path = result && !result.canceled ? result.filePaths?.[0] : undefined
          return path ? ((await desktop.activeLaneDesktop?.files?.readFile?.(path)) ?? null) : null
        },
        saveAs: async (fileHandle: WorkbenchFileHandle) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          return desktop.activeLaneDesktop?.files?.showSaveDialog?.(fileHandle) ?? null
        },
        save: async (fileHandle: WorkbenchFileHandle) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          if (fileHandle.path && desktop.activeLaneDesktop?.files?.writeFile) {
            await desktop.activeLaneDesktop.files.writeFile(fileHandle)
            return
          }
          await desktop.activeLaneDesktop?.files?.showSaveDialog?.(fileHandle)
        },
        workspaceRoot: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          return desktop.activeLaneDesktop?.files?.workspaceRoot?.()
        },
        readDirectory: async (path?: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          if (!desktop.activeLaneDesktop?.files?.readDirectory) {
            throw new Error('Filesystem browsing is not available in this host.')
          }
          return desktop.activeLaneDesktop.files.readDirectory(path)
        },
        revealInFileManager: async (path: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          await desktop.activeLaneDesktop?.files?.revealInFileManager?.(path)
        },
        openPath: async (path: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          await desktop.activeLaneDesktop?.files?.openPath?.(path)
        },
        openWithSystemApp: async (path: string, appId: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          await desktop.activeLaneDesktop?.files?.openWithSystemApp?.(path, appId)
        },
        listSystemFileOpeners: async (path: string) => {
          const desktop = window as Window & {
            activeLaneDesktop?: { files?: ActiveLaneDesktopFilesApi }
          }
          return desktop.activeLaneDesktop?.files?.listSystemFileOpeners?.(path) ?? []
        },
      },
      alx: {
        available: Boolean(
          (window as Window & { activeLaneDesktop?: { alx?: unknown } }).activeLaneDesktop?.alx,
        ),
        run: async (input) => {
          const desktop = window as unknown as Window & {
            activeLaneDesktop?: { alx?: { run?: (payload: typeof input) => Promise<unknown> } }
          }
          if (!desktop.activeLaneDesktop?.alx?.run) {
            return {
              ok: false,
              command: input.command,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              logs: [{ level: 'error', message: 'ALX is not available in this host.' }],
              error: { message: 'ALX is not available in this host.' },
            } satisfies ActiveLaneAlxRunResult
          }
          return (await desktop.activeLaneDesktop.alx.run(input)) as ActiveLaneAlxRunResult
        },
        selectDirectory: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { alx?: { selectDirectory?: () => Promise<string | undefined> } }
          }
          return desktop.activeLaneDesktop?.alx?.selectDirectory?.()
        },
        selectPackage: async () => {
          const desktop = window as Window & {
            activeLaneDesktop?: { alx?: { selectPackage?: () => Promise<string | undefined> } }
          }
          return desktop.activeLaneDesktop?.alx?.selectPackage?.()
        },
      },
    },
  }
}

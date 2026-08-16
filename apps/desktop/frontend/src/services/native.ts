import type {
  ActiveLaneExtensionManifest,
  InstalledExtensionRecord,
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHostCapabilities,
  WorkbenchNotificationOptions,
  WorkbenchRegistrySearchResponse,
  WorkbenchRegistryStatusResponse,
} from '@activelane/workbench'
import { Clipboard, Dialogs, System, Window as WailsWindow } from '@wailsio/runtime'
import {
  Disable as DisableExtension,
  Enable as EnableExtension,
  Install as InstallExtension,
  Installed as InstalledExtensions,
  Registries as RegistryStatuses,
  Search as SearchRegistries,
  Uninstall as UninstallExtension,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/extensionservice'
import type {
  DesktopError,
  InstalledExtension,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/models'
import {
  ReadDirectory,
  ReadFile,
  Root,
  SetRoot,
  WriteFile,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/workspaceservice'

export class NativeExtensionError extends Error {
  readonly code: string
  readonly detail?: string

  constructor(error: DesktopError) {
    super(error.message)
    this.name = 'NativeExtensionError'
    this.code = error.code
    this.detail = error.detail
  }
}

function throwNativeError(error?: DesktopError | null): void {
  if (error) throw new NativeExtensionError(error)
}

function mapInstalled(record: InstalledExtension): InstalledExtensionRecord {
  return {
    id: record.id,
    extensionId: record.extensionId,
    displayName: record.displayName,
    version: record.version,
    enabled: record.enabled,
    state: record.enabled ? 'enabled' : 'disabled',
    installSource: 'marketplace',
    installedAt: record.installedAt,
    updatedAt: record.updatedAt,
    manifest: record.manifest as unknown as ActiveLaneExtensionManifest,
    resolvedPath: record.installPath,
    source: {
      type: 'registry',
      registryId: record.registryId,
    },
    digest: record.packageDigest,
    manifestDigest: record.manifestDigest,
    integrityState: record.integrityState as InstalledExtensionRecord['integrityState'],
    restartRequired: record.restartRequired,
  }
}

export async function getPlatform() {
  return (await System.Environment()).OS
}

export const workbenchWindow = WailsWindow

export function createNativeCapabilities(): WorkbenchHostCapabilities {
  return {
    lifecycle: { closeWindow: () => workbenchWindow.Close() },
    storage: undefined,
    notify: async ({ title, message, tone }: WorkbenchNotificationOptions) => {
      const options = { Title: title, Message: message ?? '' }
      if (tone === 'error') await Dialogs.Error(options)
      else if (tone === 'warning') await Dialogs.Warning(options)
      else await Dialogs.Info(options)
      return undefined
    },
    confirm: async ({ title, message, confirmLabel, cancelLabel }: WorkbenchDialogOptions) => {
      const accepted = confirmLabel ?? 'OK'
      const result = await Dialogs.Question({
        Title: title,
        Message: message,
        Buttons: [
          { Label: cancelLabel ?? 'Cancel', IsCancel: true },
          { Label: accepted, IsDefault: true },
        ],
      })
      return result === accepted
    },
    clipboard: {
      readText: () => Clipboard.Text(),
      writeText: (value) => Clipboard.SetText(value),
    },
    network: { fetch: (input, init) => fetch(input, init) },
    registry: {
      status: async () => {
        const response = await RegistryStatuses()
        throwNativeError(response.error)
        return response as unknown as WorkbenchRegistryStatusResponse
      },
      search: async (query) => {
        const response = await SearchRegistries(query)
        throwNativeError(response.error)
        return response as unknown as WorkbenchRegistrySearchResponse
      },
    },
    extensions: {
      listInstalled: async () => {
        const response = await InstalledExtensions()
        throwNativeError(response.error)
        return response.items.map(mapInstalled)
      },
      install: async (extensionId, version, registryId) => {
        if (!version || !registryId) {
          throw new Error('Exact extension version and source registry are required.')
        }
        const response = await InstallExtension(registryId, extensionId, version)
        throwNativeError(response.error)
        return response.record ? mapInstalled(response.record) : undefined
      },
      enable: async (extensionId) => {
        const response = await EnableExtension(extensionId)
        throwNativeError(response.error)
        return response.record ? mapInstalled(response.record) : undefined
      },
      disable: async (extensionId) => {
        const response = await DisableExtension(extensionId)
        throwNativeError(response.error)
        return response.record ? mapInstalled(response.record) : undefined
      },
      uninstall: async (extensionId) => {
        const response = await UninstallExtension(extensionId)
        throwNativeError(response.error)
      },
    },
    files: {
      open: async () => {
        const path = await Dialogs.OpenFile({ Title: 'Open File', CanChooseFiles: true })
        return path ? (ReadFile(path) as Promise<WorkbenchFileHandle>) : null
      },
      read: (path) => ReadFile(path) as Promise<WorkbenchFileHandle>,
      openFolder: async () => {
        const path = await Dialogs.OpenFile({
          Title: 'Open Folder',
          CanChooseFiles: false,
          CanChooseDirectories: true,
        })
        if (!path) return undefined
        await SetRoot(path)
        return path
      },
      openWorkspaceFile: async () => {
        const path = await Dialogs.OpenFile({ Title: 'Open Workspace', CanChooseFiles: true })
        return path ? (ReadFile(path) as Promise<WorkbenchFileHandle>) : null
      },
      saveAs: async (file) => {
        const path = await Dialogs.SaveFile({ Title: 'Save File', Filename: file.name })
        return path ? (WriteFile({ ...file, path }) as Promise<WorkbenchFileHandle>) : null
      },
      save: async (file) => {
        if (file.path) {
          await WriteFile(file)
          return
        }
        const path = await Dialogs.SaveFile({ Title: 'Save File', Filename: file.name })
        if (path) await WriteFile({ ...file, path })
      },
      workspaceRoot: async () => (await Root()) || undefined,
      readDirectory: async (path) =>
        (await ReadDirectory(path ?? '')) as WorkbenchFileSystemEntry[],
    },
  }
}

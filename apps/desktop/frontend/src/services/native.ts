import type {
  ActiveLaneExtensionManifest,
  InstalledExtensionRecord,
  WorkbenchDialogOptions,
  WorkbenchExtensionDefinition,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHostCapabilities,
  WorkbenchNotificationOptions,
  WorkbenchRegistrySearchResponse,
  WorkbenchRegistryStatusResponse,
  WorkbenchSubscriptionProvider,
} from '@activelane/workbench'
import { Clipboard, Dialogs, System, Window as WailsWindow } from '@wailsio/runtime'
import {
  Disable as DisableExtension,
  Enable as EnableExtension,
  Module as ExtensionModule,
  Install as InstallExtension,
  Installed as InstalledExtensions,
  Registries as RegistryStatuses,
  ResolveAsset as ResolveExtensionAsset,
  Search as SearchRegistries,
  Uninstall as UninstallExtension,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/extensionservice'
import type {
  DesktopError,
  InstalledExtension,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/models'
import { Request as NativeNetworkRequest } from '../../bindings/github.com/activelane/activelane/apps/desktop/networkservice'
import {
  ReadDirectory,
  ReadFile,
  Root,
  SetRoot,
  WriteFile,
} from '../../bindings/github.com/activelane/activelane/apps/desktop/workspaceservice'
import {
  loadNativeExtensionModule,
  type NativeExtensionModulePayload,
} from './extensionModuleLoader'

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
  const development = record.installSource === 'development'
  return {
    id: record.id,
    extensionId: record.extensionId,
    displayName: record.displayName,
    version: record.version,
    enabled: record.enabled,
    state: record.enabled ? 'enabled' : 'disabled',
    installSource: development ? 'development' : 'marketplace',
    installedAt: record.installedAt,
    updatedAt: record.updatedAt,
    manifest: record.manifest as unknown as ActiveLaneExtensionManifest,
    resolvedPath: record.installPath,
    source: development
      ? { type: 'development' }
      : { type: 'registry', registryId: record.registryId },
    digest: record.packageDigest,
    manifestDigest: record.manifestDigest,
    integrityState: record.integrityState as InstalledExtensionRecord['integrityState'],
    restartRequired: record.restartRequired,
  }
}

async function loadInstalledExtension(
  record: InstalledExtensionRecord,
): Promise<WorkbenchExtensionDefinition> {
  const match = record.extensionId.match(/^@([^/]+)\/(.+)$/)
  const namespace = match?.[1]
  const name = match?.[2]
  if (!namespace || !name)
    throw new Error(`Invalid installed extension identity: ${record.extensionId}`)
  const entry = record.manifest.entry
  if (!entry)
    throw new Error(
      `Installed extension ${record.extensionId}@${record.version} has no runtime entrypoint.`,
    )
  const response = await ExtensionModule(record.extensionId, record.version)
  throwNativeError(response.error)
  return loadNativeExtensionModule({ record, payload: response as NativeExtensionModulePayload })
}

export async function getPlatform() {
  return (await System.Environment()).OS
}

export const workbenchWindow = WailsWindow

function parseExtensionIdentity(extensionId: string) {
  const match = extensionId.match(/^@([^/]+)\/(.+)$/)
  const namespace = match?.[1]
  const name = match?.[2]
  if (!namespace || !name) throw new Error(`Invalid extension identity: ${extensionId}`)
  return { namespace, name }
}

async function resolveExtensionRegistry(extensionId: string) {
  const { namespace } = parseExtensionIdentity(extensionId)
  const installed = await InstalledExtensions()
  throwNativeError(installed.error)
  const installedRecord = installed.items.find((item) => item.extensionId === extensionId)
  const statuses = await RegistryStatuses()
  throwNativeError(statuses.error)
  const status = statuses.registries.find(
    (item) =>
      item.enabled &&
      item.type === 'remote' &&
      (item.id === installedRecord?.registryId || item.scopes.includes(namespace)),
  )
  const source = installedRecord?.registrySource || status?.source
  if (!source || !/^https?:\/\//.test(source)) {
    throw new Error(`No remote registry source is available for ${extensionId}.`)
  }
  return {
    source: source.replace(/\/$/, ''),
    commerce: status?.capabilities?.commerce === true,
  }
}

async function subscriptionEndpoint(extensionId: string, suffix: string) {
  const { namespace, name } = parseExtensionIdentity(extensionId)
  const registry = await resolveExtensionRegistry(extensionId)
  const path = `/v1/accounts/local-development/extensions/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}${suffix}`
  return { url: `${registry.source}${path}`, commerce: registry.commerce }
}

function createRegistrySubscriptionProvider(): WorkbenchSubscriptionProvider {
  const request = async <T>(extensionId: string, suffix: string, init?: RequestInit) => {
    const endpoint = await subscriptionEndpoint(extensionId, suffix)
    if (!endpoint.commerce) {
      throw new Error(`Registry commerce is unavailable for ${extensionId}.`)
    }
    const response = await NativeNetworkRequest({
      method: init?.method ?? 'GET',
      url: endpoint.url,
      headers: { 'content-type': 'application/json' },
      body: typeof init?.body === 'string' ? init.body : '',
    })
    throwNativeError(response.error)
    if (response.status === 404 && !init) return undefined as T
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.body || `Registry returned ${response.status}.`)
    }
    return JSON.parse(response.body) as T
  }
  return {
    getSubscription: async (extensionId) => {
      const endpoint = await subscriptionEndpoint(extensionId, '/subscription')
      if (!endpoint.commerce) return undefined
      return request(extensionId, '/subscription')
    },
    subscribe: (extensionId, planId) =>
      request(extensionId, '/subscription', { method: 'POST', body: JSON.stringify({ planId }) }),
    changePlan: (extensionId, planId) =>
      request(extensionId, '/subscription/plan', {
        method: 'PUT',
        body: JSON.stringify({ planId }),
      }),
    cancel: (extensionId) =>
      request(extensionId, '/subscription/cancel', { method: 'POST', body: '{}' }),
    resume: (extensionId) =>
      request(extensionId, '/subscription/resume', { method: 'POST', body: '{}' }),
    resolveEntitlements: async (extensionId) => {
      const endpoint = await subscriptionEndpoint(extensionId, '/entitlements')
      if (!endpoint.commerce) {
        return {
          accountId: 'local-development',
          extensionId,
          planId: 'free',
          entitlements: [],
          resolvedAt: new Date().toISOString(),
        }
      }
      return request(extensionId, '/entitlements')
    },
  }
}

export function createNativeCapabilities(): WorkbenchHostCapabilities {
  return {
    extensionAssets: {
      resolve: async (extensionId, resourcePath) => {
        const response = await InstalledExtensions()
        throwNativeError(response.error)
        const installed = response.items.find(
          (item) => item.extensionId === extensionId && item.enabled,
        )
        if (!installed) throw new Error(`Enabled extension ${extensionId} is not installed.`)
        const resolved = await ResolveExtensionAsset(extensionId, installed.version, resourcePath)
        throwNativeError(resolved.error)
        if (!resolved.url) throw new Error(`No asset URL was returned for ${extensionId}.`)
        return { url: resolved.url }
      },
    },
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
    network: {
      request: async (input) => {
        const response = await NativeNetworkRequest({
          method: input.method,
          url: input.url,
          headers: input.headers ?? {},
          body: input.body ?? '',
        })
        throwNativeError(response.error)
        return {
          status: response.status,
          statusText: response.statusText,
          durationMs: response.durationMs,
          sizeBytes: response.sizeBytes,
          headers: Object.fromEntries(
            Object.entries(response.headers).filter((entry): entry is [string, string[]] =>
              Array.isArray(entry[1]),
            ),
          ),
          body: response.body,
        }
      },
    },
    subscriptions: createRegistrySubscriptionProvider(),
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
      load: loadInstalledExtension,
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

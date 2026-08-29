import type {
  ActiveLaneExtensionVisibility,
  ExtensionArtifact,
  ExtensionPublisher,
  ExtensionVersionMetadata,
  InstalledExtensionRecord,
  RegistryExtensionRecord,
} from '../extensions/types'

export const ACTIVELANE_REGISTRY_API_VERSION = 'v1'

export const ACTIVELANE_REGISTRY_API_PREFIX = `/${ACTIVELANE_REGISTRY_API_VERSION}`

export const registryRoutePatterns = {
  health: `${ACTIVELANE_REGISTRY_API_PREFIX}/health`,
  listExtensions: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions`,
  listInstalledExtensions: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/installed`,
  listCapabilities: `${ACTIVELANE_REGISTRY_API_PREFIX}/capabilities`,
  invokeCapability: `${ACTIVELANE_REGISTRY_API_PREFIX}/capabilities/:capabilityName/invoke`,
  installExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/install`,
  uninstallExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/uninstall`,
  enableExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/enable`,
  disableExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/disable`,
  publishExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/publish`,
  getExtension: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name`,
  listVersions: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name/versions`,
  getVersion: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name/versions/:version`,
  downloadVersion: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name/versions/:version/download`,
  yankVersion: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name/versions/:version/yank`,
  blockVersion: `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/:publisher/:name/versions/:version/block`,
  publishers: `${ACTIVELANE_REGISTRY_API_PREFIX}/publishers`,
  exportBundle: `${ACTIVELANE_REGISTRY_API_PREFIX}/export`,
  importBundle: `${ACTIVELANE_REGISTRY_API_PREFIX}/import`,
} as const

export const registryRoutes = {
  health: registryRoutePatterns.health,
  listExtensions: registryRoutePatterns.listExtensions,
  listInstalledExtensions: registryRoutePatterns.listInstalledExtensions,
  listCapabilities: registryRoutePatterns.listCapabilities,
  invokeCapability: registryRoutePatterns.invokeCapability,
  installExtension: registryRoutePatterns.installExtension,
  uninstallExtension: registryRoutePatterns.uninstallExtension,
  enableExtension: registryRoutePatterns.enableExtension,
  disableExtension: registryRoutePatterns.disableExtension,
  publishExtension: registryRoutePatterns.publishExtension,
  getExtension: (publisher: string, name: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}`,
  listVersions: (publisher: string, name: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}/versions`,
  getVersion: (publisher: string, name: string, version: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}/versions/${registryPathSegment(version)}`,
  downloadVersion: (publisher: string, name: string, version: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}/versions/${registryPathSegment(version)}/download`,
  yankVersion: (publisher: string, name: string, version: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}/versions/${registryPathSegment(version)}/yank`,
  blockVersion: (publisher: string, name: string, version: string) =>
    `${ACTIVELANE_REGISTRY_API_PREFIX}/extensions/${registryPathSegment(publisher)}/${registryPathSegment(name)}/versions/${registryPathSegment(version)}/block`,
  publishers: registryRoutePatterns.publishers,
  exportBundle: registryRoutePatterns.exportBundle,
  importBundle: registryRoutePatterns.importBundle,
} as const

export const registryMethods = {
  health: 'GET',
  listExtensions: 'GET',
  listInstalledExtensions: 'GET',
  listCapabilities: 'GET',
  installExtension: 'POST',
  uninstallExtension: 'POST',
  enableExtension: 'POST',
  disableExtension: 'POST',
  publishExtension: 'POST',
  getExtension: 'GET',
  listVersions: 'GET',
  getVersion: 'GET',
  downloadVersion: 'GET',
  yankVersion: 'POST',
  blockVersion: 'POST',
  listPublishers: 'GET',
  createPublisher: 'POST',
  exportBundle: 'GET',
  importBundle: 'POST',
} as const

export interface RegistryErrorResponse {
  error: {
    code: string
    message: string
    status: number
    details?: unknown
  }
}

export interface RegistryHealthResponse {
  ok: true
  service: 'activelane-registry'
  version: typeof ACTIVELANE_REGISTRY_API_VERSION
  timestamp: string
}

export type RegistryErrorCode =
  | 'BAD_REQUEST'
  | 'INVALID_JSON'
  | 'INVALID_MANIFEST'
  | 'INVALID_PUBLISHER'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND'
  | 'VERSION_IMMUTABLE'
  | 'VERSION_NOT_FOUND'

export interface RegistryListExtensionsQuery {
  search?: string
  visibility?: ActiveLaneExtensionVisibility
}

export type RegistryListExtensionsResponse = RegistryExtensionRecord[]

export type RegistryListInstalledExtensionsResponse = InstalledExtensionRecord[]

export type RegistryGetExtensionResponse = RegistryExtensionRecord

export type RegistryListVersionsResponse = ExtensionVersionMetadata[]

export type RegistryGetVersionResponse = ExtensionVersionMetadata

export type RegistryDownloadVersionResponse = Uint8Array

export type RegistryPublishExtensionRequest = Uint8Array

export type RegistryPublishExtensionResponse = ExtensionVersionMetadata

export type RegistryListPublishersResponse = ExtensionPublisher[]

export interface RegistryCreatePublisherRequest {
  id: string
  displayName?: string
}

export type RegistryCreatePublisherResponse = ExtensionPublisher

export type RegistryYankVersionResponse = ExtensionVersionMetadata

export type RegistryBlockVersionResponse = ExtensionVersionMetadata

export type RegistryExportBundleResponse = Uint8Array

export type RegistryImportBundleResponse = undefined

export interface RegistryBundle {
  format: 'activelane.registry'
  formatVersion: 1
  exportedAt: string
  versions: Array<ExtensionVersionMetadata & { packageBase64: string }>
}

export interface RegistryPublishArtifact {
  artifact: ExtensionArtifact
  version: ExtensionVersionMetadata
}

export interface WorkbenchInstallExtensionRequest {
  extensionId: string
  version?: string
}

export interface WorkbenchInstallLocalExtensionPackageRequest {
  filePath?: string
  fileName?: string
  contents?: string
  enabled?: boolean
}

export interface WorkbenchExtensionStateRequest {
  extensionId: string
}

function registryPathSegment(value: string): string {
  return encodeURIComponent(value)
}

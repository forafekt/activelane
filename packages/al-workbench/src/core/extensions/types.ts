import type { ViewContainer, ViewDefinition } from '../../views/model'
import type { ActiveLaneCapability, ActiveLaneCapabilityService } from '../capabilities/types'
import type { WorkbenchExtensionEntitlements } from '../entitlements/types'
import type { WorkbenchHostAdapter, WorkbenchStorageScope } from '../host/types'
import type { ServerExtensionDeclaration } from '../serverRuntime'
import type { Disposable, MaybePromise } from '../shared/types'
import type {
  WorkbenchActionContribution,
  WorkbenchActivityContribution,
  WorkbenchApplicationContribution,
  WorkbenchBottomPaneContribution,
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
  WorkbenchGlobalMenuContribution,
  WorkbenchInspectorPanelContribution,
  WorkbenchMenuItemContribution,
  WorkbenchPartContribution,
  WorkbenchSettingsPageContribution,
  WorkbenchSidebarViewContribution,
  WorkbenchStatusBarItemContribution,
  WorkbenchTabRendererContribution,
} from '../workbench/contributions'
import type { FileOpenerContribution } from '../workbench/fileOpeners'
import type {
  ActiveLaneSettingsContribution,
  WorkbenchSettingDefinition,
} from '../workbench/settings'
import type { WorkbenchContributionRegistrar, WorkbenchShellApi } from '../workbench/shell'
import type { WorkbenchThemeContribution } from '../workbench/themes'

export interface WorkbenchMarketplaceEntry {
  categories?: string[]
  featured?: boolean
  keywords?: string[]
  longDescription?: string
  screenshots?: Array<{ title: string; src: string }>
}

export interface WorkbenchSubscriptionPlan {
  id: string
  name: string
  description?: string
  interval: 'none' | 'monthly' | 'yearly'
  priceMinor: number
  currency: string
  trialDays?: number
  features?: string[]
  entitlements?: string[]
}

export interface WorkbenchMarketplaceMetadata {
  icon?: string
  summary?: string
  longDescription?: string
  categories?: string[]
  capabilities?: string[]
  highlights?: string[]
  media?: Array<{ type: 'image' | 'video'; source: string; title?: string; altText?: string }>
  releaseNotes?: string
  plans?: WorkbenchSubscriptionPlan[]
  featured?: boolean
}

export interface WorkbenchApiRouteDefinition {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description?: string
}

export interface WorkbenchJobDefinition {
  id: string
  title: string
  description?: string
  schedule?: string
  tags?: string[]
}

export interface WorkbenchJobRuntimeRecord extends WorkbenchJobDefinition {
  extensionId?: string
}

export interface WorkbenchEventEnvelope<TPayload = unknown> {
  type: string
  payload: TPayload
  source?: string
  timestamp: string
}

export interface WorkbenchEventBus {
  emit: <TPayload = unknown>(type: string, payload: TPayload, source?: string) => void
  on: <TPayload = unknown>(
    type: string,
    listener: (event: WorkbenchEventEnvelope<TPayload>) => void,
  ) => Disposable
}

export type WorkbenchServerContribution = Partial<ServerExtensionDeclaration>

export interface WorkbenchContributions {
  containers?: ViewContainer[]
  views?: ViewDefinition[]
  parts?: WorkbenchPartContribution[]
  statusBar?: WorkbenchStatusBarItemContribution[]
  applicationMenus?: WorkbenchGlobalMenuContribution[]
  globalMenus?: WorkbenchGlobalMenuContribution[]
  activityRail?: WorkbenchActivityContribution[]
  apps?: WorkbenchApplicationContribution[]
  sidebarViews?: WorkbenchSidebarViewContribution[]
  commands?: WorkbenchCommandContribution[]
  commandPalette?: WorkbenchCommandPaletteContribution[]
  tabRenderers?: WorkbenchTabRendererContribution[]
  tabToolbarActions?: WorkbenchActionContribution[]
  tabContextMenu?: WorkbenchMenuItemContribution[]
  bottomPaneViews?: WorkbenchBottomPaneContribution[]
  inspectorPanels?: WorkbenchInspectorPanelContribution[]
  settingsPages?: WorkbenchSettingsPageContribution[]
  settings?: Array<WorkbenchSettingDefinition | ActiveLaneSettingsContribution>
  menus?: WorkbenchMenuItemContribution[]
  fileOpeners?: FileOpenerContribution[]
  themes?: WorkbenchThemeContribution[]
  capabilities?: ActiveLaneCapability[]
  server?: WorkbenchServerContribution
  marketplace?: WorkbenchMarketplaceEntry
}

export type WorkbenchActivationEvent = 'onStartup' | 'onCommand' | 'onView' | 'onTab' | 'onDemand'
export type WorkbenchExtensionType = 'ui' | 'server' | 'hybrid'

export interface ServerExtensionPermissions {
  filesystem?: 'none' | 'workspace' | 'host'
  network?: 'none' | 'loopback' | 'remote'
  processes?: boolean
  secrets?: boolean
}

export interface WorkbenchExtensionManifest {
  id: string
  name: string
  displayName: string
  version: string
  description?: string
  type?: WorkbenchExtensionType
  author?: string
  builtin?: boolean
  categories?: string[]
  keywords?: string[]
  dependencies?: string[] | Record<string, string>
  capabilities?: ActiveLaneCapability[]
  server?: WorkbenchServerContribution
  permissions?: ActiveLaneExtensionPermission[]
  activationEvents?: WorkbenchActivationEvent[]
  contributes?: WorkbenchContributions
}

export type ActiveLaneExtensionVisibility = 'public' | 'private' | 'unlisted' | 'company'
export type ActiveLaneHostSupport = 'webapp' | 'desktop' | 'browser-extension' | 'server'
export type ActiveLaneExtensionKind = 'workbench' | 'server'
export type ExtensionVersionStatus = 'draft' | 'published' | 'yanked' | 'blocked'
export type ActiveLaneExtensionPermission = 'extension-storage'

export interface ActiveLaneExtensionManifest extends Omit<WorkbenchExtensionManifest, 'dependencies'> {
  schemaVersion?: '1.0.0'
  publisher?: string
  entry?: string
  engines?: {
    activelane: string
  }
  hostSupport?: ActiveLaneHostSupport[]
  dependencies?: Record<string, string> | string[]
  extensionKind?: ActiveLaneExtensionKind[]
  visibility?: ActiveLaneExtensionVisibility
  os?: Array<'linux' | 'darwin' | 'windows'>
  architecture?: Array<'amd64' | 'arm64' | '386'>
  marketplace?: WorkbenchMarketplaceMetadata
}

export interface ExtensionPackageRef {
  type: 'builtin' | 'marketplace' | 'local' | 'npm' | 'url' | 'mock'
  source: string
  integrity?: string
}

export interface MarketplaceExtensionPublisher {
  id: string
  name: string
  verified?: boolean
}

export interface MarketplaceExtensionRecord {
  id: string
  slug: string
  name: string
  displayName: string
  description?: string
  version: string
  publisher: MarketplaceExtensionPublisher
  categories: string[]
  tags: string[]
  icon?: string
  screenshots?: string[]
  readme?: string
  license?: string
  homepageUrl?: string
  repositoryUrl?: string
  manifest: ActiveLaneExtensionManifest
  package: ExtensionPackageRef
  capabilities?: ActiveLaneCapability[]
  permissions?: string[]
  createdAt: string
  updatedAt: string
  featured?: boolean
  plans?: WorkbenchSubscriptionPlan[]
  registryId?: string
  registryDisplayName?: string
  versionStatus?: ExtensionVersionStatus
  compatible?: boolean
  compatibilityReason?: string
}

export interface InstalledExtensionRecord {
  id: string
  extensionId: string
  displayName: string
  version: string
  enabled: boolean
  state?: ExtensionInstallState
  installSource: 'marketplace' | 'local' | 'builtin' | 'mock' | 'development'
  installedAt: string
  updatedAt: string
  manifest: ActiveLaneExtensionManifest
  packageRef?: ExtensionPackageRef
  resolvedPath?: string
  settings?: Record<string, unknown>
  source?: {
    type: 'registry' | 'local' | 'builtin' | 'development'
    registryId?: string
    artifactUrl?: string
    packagePath?: string
  }
  digest?: string
  packagePath?: string
  manifestDigest?: string
  integrityState?: 'verified' | 'missing' | 'invalid' | 'mismatch' | 'development'
  restartRequired?: boolean
}

export type ExtensionInstallState = 'installed' | 'enabled' | 'disabled' | 'uninstalled'

export interface RegistryDescriptor {
  id: string
  url: string
  priority: number
  visibility: ActiveLaneExtensionVisibility
  auth?: RegistryAuthProvider
}

export interface RegistryAuthProvider {
  getAuthorizationHeader(registry: RegistryDescriptor): Promise<string | undefined>
}

export interface ExtensionPublisher {
  id: string
  displayName: string
  createdAt: string
}

export interface ExtensionArtifact {
  digest: string
  algorithm: 'sha256'
  sizeBytes: number
  downloadUrl: string
}

export interface ExtensionVersionMetadata {
  extensionId: string
  publisher: string
  name: string
  version: string
  status: ExtensionVersionStatus
  manifest: ActiveLaneExtensionManifest
  artifact: ExtensionArtifact
  publishedAt?: string
  yankedAt?: string
  blockedAt?: string
}

export interface RegistryExtensionRecord {
  id: string
  publisher: string
  name: string
  displayName: string
  description?: string
  visibility: ActiveLaneExtensionVisibility
  latestVersion?: string
  versions: ExtensionVersionMetadata[]
  registryId?: string
  registryDisplayName?: string
}

export interface WorkbenchRegistryError {
  code: string
  message: string
  detail?: string
}

export interface WorkbenchRegistrySearchItem {
  registryId: string
  registryDisplayName: string
  id: string
  namespace: string
  name: string
  displayName: string
  description: string
  version: string
  versionStatus: ExtensionVersionStatus
  manifest: ActiveLaneExtensionManifest
  manifestDigest: string
  packageDigest: string
  publishedAt: string
  compatible: boolean
  compatibilityReason?: string
}

export interface WorkbenchRegistryFailure {
  registryId: string
  registryDisplayName: string
  error: WorkbenchRegistryError
}

export interface WorkbenchRegistrySearchResponse {
  items: WorkbenchRegistrySearchItem[]
  failures: WorkbenchRegistryFailure[]
  mode: 'none' | 'local-only' | 'connected'
  publicRegistryEnabled: boolean
  error?: WorkbenchRegistryError
}

export interface WorkbenchRegistryStatus {
  id: string
  displayName: string
  type: 'remote' | 'directory'
  source: string
  enabled: boolean
  priority: number
  scopes: string[]
  state: 'disabled' | 'available' | 'unavailable'
  capabilities?: Record<string, boolean>
  error?: WorkbenchRegistryError
}

export interface WorkbenchRegistryStatusResponse {
  registries: WorkbenchRegistryStatus[]
  mode: 'none' | 'local-only' | 'connected'
  publicRegistryEnabled: boolean
  error?: WorkbenchRegistryError
}

export interface ExtensionPackage {
  manifest: ActiveLaneExtensionManifest
  bytes: Uint8Array
  digest: string
  fileName?: string
}

export interface ExtensionStore {
  listInstalled(): Promise<InstalledExtensionRecord[]>
  getInstalled(extensionId: string): Promise<InstalledExtensionRecord | undefined>
  saveInstalled(
    record: InstalledExtensionRecord,
    pkg?: ExtensionPackage,
  ): Promise<InstalledExtensionRecord>
  removeInstalled(extensionId: string): Promise<void>
  setEnabled(extensionId: string, enabled: boolean): Promise<InstalledExtensionRecord>
  readPackage?(extensionId: string): Promise<ExtensionPackage | undefined>
}

export interface ExtensionRegistryService {
  list(query?: {
    search?: string
    visibility?: ActiveLaneExtensionVisibility
  }): Promise<RegistryExtensionRecord[]>
  search(query: string): Promise<RegistryExtensionRecord[]>
  get(extensionId: string): Promise<RegistryExtensionRecord | undefined>
  listVersions(extensionId: string): Promise<ExtensionVersionMetadata[]>
  getVersion(extensionId: string, version: string): Promise<ExtensionVersionMetadata | undefined>
  download(
    extensionId: string,
    version: string,
    options?: { signal?: AbortSignal; maxBytes?: number },
  ): Promise<Uint8Array>
  publish(
    bytes: Uint8Array,
    registryId?: string,
  ): Promise<ExtensionVersionMetadata & { registryId: string }>
  yank(extensionId: string, version: string, registryId?: string): Promise<ExtensionVersionMetadata>
  block(
    extensionId: string,
    version: string,
    registryId?: string,
  ): Promise<ExtensionVersionMetadata>
}

export interface ExtensionInstallOptions {
  signal?: AbortSignal
  maxArtifactBytes?: number
}

export interface ExtensionInstallService {
  install(
    extensionId: string,
    version?: string,
    options?: ExtensionInstallOptions,
  ): Promise<InstalledExtensionRecord>
  installFromPackage(
    packageBytes: ArrayBuffer | Uint8Array,
    options?: ExtensionInstallOptions,
  ): Promise<InstalledExtensionRecord>
  uninstall(extensionId: string): Promise<void>
  disable(extensionId: string): Promise<InstalledExtensionRecord>
  enable(extensionId: string): Promise<InstalledExtensionRecord>
  listInstalled(): Promise<InstalledExtensionRecord[]>
}

export interface LocalExtensionPackageRecord {
  id: string
  extensionId: string
  version: string
  fileName: string
  originalPath?: string
  installedPath: string
  sizeBytes: number
  checksum?: string
  manifest: ActiveLaneExtensionManifest
  createdAt: string
  installedAt: string
}

export interface LocalExtensionPackageFile {
  path: string
  contentBase64: string
}

export interface LocalExtensionPackageManifest {
  format: 'activelane.extension'
  formatVersion: 1
  extension: ActiveLaneExtensionManifest
  package: {
    id: string
    version: string
    createdAt: string
    files: string[]
    entrypoints?: {
      workbench?: string
      server?: string
    }
  }
  files: LocalExtensionPackageFile[]
}

export interface InstallExtensionInput {
  extensionId: string
  installSource?: InstalledExtensionRecord['installSource']
  enabled?: boolean
}

export interface InstallLocalExtensionPackageInput {
  filePath?: string
  fileName?: string
  contents?: string
  enabled?: boolean
}

export interface WorkbenchSurfaceError {
  surface: 'tab' | 'sidebar' | 'inspector' | 'command' | 'extension'
  contributionId?: string
  message: string
  timestamp: string
}

export interface WorkbenchRuntimeExtensionRecord {
  extensionId: string
  manifest: ActiveLaneExtensionManifest
  installed: boolean
  enabled: boolean
  active: boolean
  status: 'discovered' | 'installed' | 'active' | 'inactive' | 'error'
  error?: string
  surfaceErrors: WorkbenchSurfaceError[]
}

export interface WorkbenchExtensionContext {
  extensionId: string
  manifest: ActiveLaneExtensionManifest
  host: WorkbenchHostAdapter
  storage: WorkbenchStorageScope
  workbench: ExtensionWorkbenchApi
  commands: import('../runtime/types').WorkbenchCommandService
  capabilities: ActiveLaneCapabilityService
  explorer: import('../explorer/types').ExplorerRuntime
  entitlements: WorkbenchExtensionEntitlements
  runtime: import('../runtime/types').WorkbenchRuntimeApi
  contribute: WorkbenchContributionRegistrar
}

export interface ExtensionWorkbenchApi extends WorkbenchShellApi {
  openView<TContext = unknown>(
    definitionId: string,
    options?: import('../../views/model').OpenViewOptions<TContext>,
  ): import('../../views/model').ViewInstance<TContext>
}

export interface WorkbenchExtensionDefinition {
  manifest: ActiveLaneExtensionManifest
  activate?: (context: WorkbenchExtensionContext) => MaybePromise<undefined | Disposable>
  deactivate?: (context: WorkbenchExtensionContext) => MaybePromise<void>
}

export interface WorkbenchExtensionCatalogEntry {
  definition: WorkbenchExtensionDefinition
  source: 'builtin' | 'local' | 'mock' | 'remote'
}

export interface ServerRuntimeSecretsApi {
  get: (key: string) => Promise<string | undefined>
  set: (key: string, value: string) => Promise<void>
}

export interface ServerRuntimeLogger {
  debug: (message: string, metadata?: unknown) => void
  info: (message: string, metadata?: unknown) => void
  warn: (message: string, metadata?: unknown) => void
  error: (message: string, metadata?: unknown) => void
}

export interface ServerRuntimeApiRegistry {
  entries: WorkbenchApiRouteDefinition[]
  register: (route: WorkbenchApiRouteDefinition) => Disposable
}

export interface ServerRuntimeJobsRegistry {
  entries: WorkbenchJobRuntimeRecord[]
  register: (job: WorkbenchJobDefinition & { extensionId?: string }) => Disposable
}

export interface ServerExtensionContext {
  extensionId: string
  capabilities: ActiveLaneCapabilityService
  api: ServerRuntimeApiRegistry
  jobs: ServerRuntimeJobsRegistry
  events: WorkbenchEventBus
  settings: import('../workbench/settings').WorkbenchSettingsService
  storage: WorkbenchStorageScope
  secrets: ServerRuntimeSecretsApi
  permissions: ServerExtensionPermissions
  log: ServerRuntimeLogger
}

export interface ServerExtensionDefinition {
  id: string
  activate: (context: ServerExtensionContext) => MaybePromise<undefined | Disposable>
  deactivate?: (context: ServerExtensionContext) => MaybePromise<void>
}

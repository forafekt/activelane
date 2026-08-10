import type { ActiveLaneCapabilityRecord } from '../../core/capabilities/types'
import type {
  InstalledExtensionRecord,
  MarketplaceExtensionRecord,
  RegistryExtensionRecord,
  WorkbenchRuntimeExtensionRecord,
} from '../../core/extensions/types'
import {
  createWorkbenchApiHttpClient,
  createWorkbenchRuntimeHttpClient,
  WorkbenchApiHttpError,
} from '../../core/runtime/httpClient'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type {
  ActiveLaneSettingsContribution,
  WorkbenchSettingDefinition,
} from '../../core/workbench/settings'

import type {
  MarketplaceCategory,
  MarketplaceExtension,
  MarketplaceExtensionStatus,
  MarketplaceSearchFilters,
  MarketplaceSetting,
  MarketplaceSortOption,
  MarketplaceStats,
} from '../types/marketplace'

const CATEGORIES: Omit<MarketplaceCategory, 'extensionCount'>[] = [
  { id: 'platform', name: 'Platform', description: 'Core runtime and shell capabilities.' },
  { id: 'productivity', name: 'Productivity', description: 'Notes, tasks, and workflow tooling.' },
  { id: 'capture', name: 'Capture', description: 'Document and knowledge capture.' },
  { id: 'editor', name: 'Editor', description: 'Editing surfaces and transforms.' },
  { id: 'workbench', name: 'Workbench', description: 'Views, panes, and shell surfaces.' },
  { id: 'ai', name: 'AI', description: 'Optional AI provider and tool extensions.' },
  { id: 'development', name: 'Development', description: 'Developer and diagnostics tooling.' },
  { id: 'integrations', name: 'Integrations', description: 'External services and providers.' },
  { id: 'themes', name: 'Themes', description: 'Shell presentation and personalization.' },
]

function compareSemver(left: string, right: string) {
  const parse = (value: string) => {
    const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
    if (!match) return null
    return {
      numbers: [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number],
      prerelease: match[4]?.split('.') ?? [],
    }
  }
  const a = parse(left)
  const b = parse(right)
  if (!a || !b) return left.localeCompare(right)
  for (let index = 0; index < 3; index += 1) {
    const leftNumber = a.numbers[index] ?? 0
    const rightNumber = b.numbers[index] ?? 0
    if (leftNumber !== rightNumber) return leftNumber - rightNumber
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return Number(!a.prerelease.length) - Number(!b.prerelease.length)
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index]
    const rightPart = b.prerelease[index]
    if (leftPart === undefined || rightPart === undefined) return leftPart === undefined ? -1 : 1
    if (leftPart === rightPart) continue
    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : null
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : null
    if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber
    if (leftNumber !== null) return -1
    if (rightNumber !== null) return 1
    return leftPart.localeCompare(rightPart)
  }
  return 0
}

function nowIssue(
  id: string,
  message: string,
  severity: 'info' | 'warning' | 'error',
  source?: string,
) {
  return { id, message, severity, source, timestamp: new Date().toISOString() }
}

function isSettingsGroup(
  value: ActiveLaneSettingsContribution | WorkbenchSettingDefinition,
): value is ActiveLaneSettingsContribution {
  return 'properties' in value
}

function scalarDefault(value: unknown): string | number | boolean {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return JSON.stringify(value)
}

function settingType(
  type:
    | ActiveLaneSettingsContribution['properties'][string]['type']
    | WorkbenchSettingDefinition['type'],
): MarketplaceSetting['type'] {
  if (type === 'boolean' || type === 'number') return type
  if (type === 'enum') return 'select'
  return 'string'
}

function manifestSettingsSummary(
  settings: Array<ActiveLaneSettingsContribution | WorkbenchSettingDefinition> = [],
): MarketplaceSetting[] {
  return settings.flatMap((setting) => {
    if (!isSettingsGroup(setting)) {
      return [
        {
          key: setting.id,
          title: setting.label,
          description: setting.description ?? setting.label,
          type: settingType(setting.type),
          defaultValue: scalarDefault(setting.defaultValue),
        },
      ]
    }
    return Object.entries(setting.properties).map(([key, property]) => ({
      key,
      title: property.title ?? key,
      description: property.description ?? property.title ?? key,
      type: settingType(property.type),
      defaultValue: scalarDefault(property.default),
    }))
  })
}

function contributionSummary(record: WorkbenchRuntimeExtensionRecord | InstalledExtensionRecord) {
  const contributes = record.manifest.contributes
  return {
    commands: contributes?.commands?.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.category,
    })),
    statusBar: contributes?.statusBar?.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.alignment ?? 'left',
      description: item.commandId,
    })),
    activityRail: contributes?.activityRail?.map((item) => ({ id: item.id, title: item.title })),
    sidebarViews: contributes?.sidebarViews?.map((item) => ({ id: item.id, title: item.title })),
    tabRenderers: contributes?.tabRenderers?.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.tabKind,
    })),
    tabSurfaces: contributes?.tabSurfaces?.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.tabKind ?? item.mode,
      description: item.mode,
    })),
    inspectorPanels: contributes?.inspectorPanels?.map((item) => ({
      id: item.id,
      title: item.title,
    })),
    settingsPages: contributes?.settingsPages?.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.section,
    })),
    menus: contributes?.menus?.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.location,
    })),
  }
}

function capabilitySummary(
  capabilities: ActiveLaneCapabilityRecord[] | undefined,
  extensionId: string,
) {
  return (capabilities ?? [])
    .filter((capability) => capability.extensionId === extensionId)
    .map((capability) => `${capability.kind}:${capability.id}`)
}

function manifestCapabilitySummary(record: InstalledExtensionRecord) {
  return [
    ...(record.manifest.capabilities ?? []),
    ...(record.manifest.contributes?.capabilities ?? []),
  ].map((capability) => `${capability.kind}:${capability.id}`)
}

function permissionSummary(record: { manifest: { permissions?: unknown } }) {
  const permissions = record.manifest.permissions
  if (!permissions) return []
  if (Array.isArray(permissions)) return permissions.map(String)
  if (typeof permissions !== 'object') return [String(permissions)]
  const entries = Object.entries(permissions)
  return entries
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}:${String(value)}`))
}

function statusFromInstalled(record?: InstalledExtensionRecord): MarketplaceExtensionStatus {
  if (!record) return 'available'
  if (record.enabled) return 'enabled'
  return 'disabled'
}

function registryRecordToMarketplace(
  record: RegistryExtensionRecord,
): MarketplaceExtensionRecord | null {
  const latest = record.versions
    .filter((version) => version.status === 'published')
    .sort((left, right) => compareSemver(right.version, left.version))[0]
  if (!latest) return null
  const marketplace = latest.manifest.contributes?.marketplace
  const updatedAt = latest.publishedAt ?? new Date(0).toISOString()
  const appIcon = latest.manifest.contributes?.apps?.[0]?.icon
  return {
    icon: typeof appIcon === 'string' ? appIcon : '',
    id: record.id,
    slug: `${record.publisher}.${record.name}`,
    name: record.name,
    displayName: record.displayName,
    description: record.description,
    version: latest.version,
    publisher: {
      id: record.publisher,
      name: record.publisher,
      verified: record.publisher === 'activelane',
    },
    categories: marketplace?.categories ?? latest.manifest.categories ?? [],
    tags: marketplace?.keywords ?? latest.manifest.keywords ?? [],
    screenshots: marketplace?.screenshots?.map((item) => item.src) ?? [],
    readme: marketplace?.longDescription ?? latest.manifest.description,
    manifest: latest.manifest,
    package: {
      type: 'marketplace',
      source: latest.artifact.downloadUrl,
      integrity: `${latest.artifact.algorithm}-${latest.artifact.digest}`,
    },
    capabilities: latest.manifest.capabilities,
    permissions: permissionSummary({ manifest: latest.manifest }),
    createdAt: updatedAt,
    updatedAt,
    featured: marketplace?.featured,
  }
}

async function loadCatalogSnapshot(client: ReturnType<typeof createWorkbenchApiHttpClient>) {
  try {
    const [marketplace, capabilities] = await Promise.all([
      client.listMarketplaceExtensions(),
      client.listCapabilities(),
    ])
    return { marketplace, capabilities }
  } catch (error) {
    if (!(error instanceof WorkbenchApiHttpError) || error.response.status !== 404) throw error
    return {
      marketplace: (await client.listRegistryExtensions())
        .map(registryRecordToMarketplace)
        .filter((record): record is MarketplaceExtensionRecord => record !== null),
      capabilities: [] as ActiveLaneCapabilityRecord[],
    }
  }
}

function makeExtension(
  marketplace: MarketplaceExtensionRecord,
  installed: InstalledExtensionRecord | undefined,
  capabilities: ActiveLaneCapabilityRecord[],
): MarketplaceExtension {
  const hasUpdate = installed && compareSemver(marketplace.version, installed.version) > 0
  const updateAvailable = hasUpdate
    ? {
        version: marketplace.version,
        releaseDate: marketplace.updatedAt,
        changelog: `Update ${marketplace.version} is available.`,
      }
    : undefined
  return {
    id: marketplace.id,
    name: marketplace.name,
    displayName: marketplace.displayName,
    publisher: {
      name: marketplace.publisher.id,
      displayName: marketplace.publisher.name,
      verified: marketplace.publisher.verified,
      official:
        marketplace.publisher.id === 'activelane' ||
        marketplace.publisher.id === 'activelane-extensions',
      website: marketplace.homepageUrl,
    },
    version: marketplace.version,
    installedVersion: installed?.version,
    description: marketplace.description ?? 'ActiveLane marketplace extension.',
    longDescription:
      marketplace.readme ?? marketplace.description ?? 'ActiveLane marketplace extension.',
    readme: [marketplace.readme ?? marketplace.description ?? ''],
    icon: marketplace.icon ?? '',
    categories: marketplace.categories.map((item) => item.toLowerCase()),
    tags: marketplace.tags,
    pricingModel: 'free',
    featured: marketplace.categories.includes('platform') || marketplace.categories.includes('ai'),
    recommended: marketplace.publisher.verified === true,
    recentlyUpdated: true,
    rating: { average: 4.6, count: 24 },
    downloads: { total: 1200, weekly: 80 },
    lastUpdated: marketplace.updatedAt,
    firstPublished: marketplace.createdAt,
    repository: marketplace.repositoryUrl,
    homepage: marketplace.homepageUrl,
    status: updateAvailable ? 'update-available' : statusFromInstalled(installed),
    installState: installed ? 'installed' : 'not-installed',
    updateAvailable,
    contributions: contributionSummary(
      installed ?? ({ manifest: marketplace.manifest } as InstalledExtensionRecord),
    ),
    capabilities: installed
      ? capabilitySummary(capabilities, installed.extensionId).length
        ? capabilitySummary(capabilities, installed.extensionId)
        : manifestCapabilitySummary(installed)
      : (marketplace.capabilities ?? []).map((capability) => `${capability.kind}:${capability.id}`),
    permissions: installed ? permissionSummary(installed) : (marketplace.permissions ?? []),
    settings: manifestSettingsSummary(marketplace.manifest.contributes?.settings),
    dependencies: Array.isArray(marketplace.manifest.dependencies)
      ? marketplace.manifest.dependencies
      : Object.entries(marketplace.manifest.dependencies ?? {}).map(
          ([name, version]) => `${name}@${version}`,
        ),
    changelog: [
      {
        version: marketplace.version,
        date: marketplace.updatedAt,
        changes: ['Catalog-backed local registry entry.'],
      },
    ],
    gallery: (marketplace.screenshots ?? []).map((src, index) => ({
      title: `Screenshot ${index + 1}`,
      description: src,
    })),
    errors: [],
    warnings: [],
    manifest: marketplace.manifest,
    runtime: installed
      ? {
          extensionId: installed.extensionId,
          manifest: installed.manifest,
          installed: true,
          enabled: installed.enabled,
          active: false,
          status: installed.enabled ? 'inactive' : 'installed',
          surfaceErrors: [],
        }
      : undefined,
    activationEvents: marketplace.manifest.activationEvents ?? [],
    hostCompatibility: ['webapp', 'desktop', 'local backend'],
    lifecycleState: installed ? (installed.enabled ? 'inactive' : 'installed') : 'available',
    logs: [],
    packageType: installed?.installSource === 'local' ? 'local' : marketplace.package.type,
  }
}

export class MarketplaceCatalogService {
  private readonly extensions = new Map<string, MarketplaceExtension>()
  private runtime: WorkbenchRuntimeApi | null = null
  private loaded = false
  private loadingPromise: Promise<void> | null = null

  setRuntimeApi(runtime: WorkbenchRuntimeApi) {
    this.runtime = runtime
  }

  private get backendClient() {
    return this.runtime
      ? createWorkbenchRuntimeHttpClient(this.runtime)
      : createWorkbenchApiHttpClient()
  }

  async ensureLoaded() {
    if (this.loaded) return
    if (this.loadingPromise) return this.loadingPromise
    this.loadingPromise = this.refresh()
    await this.loadingPromise
  }

  getExtension(id: string) {
    return this.extensions.get(id)
  }

  getAllExtensions() {
    return Array.from(this.extensions.values())
  }

  getCategories(): MarketplaceCategory[] {
    const all = this.getAllExtensions()
    return CATEGORIES.map((category) => ({
      ...category,
      extensionCount: all.filter((extension) => extension.categories.includes(category.id)).length,
    }))
  }

  getStats(): MarketplaceStats {
    const extensions = this.getAllExtensions()
    return {
      totalExtensions: extensions.length,
      installedExtensions: extensions.filter((item) => item.installState === 'installed').length,
      enabledExtensions: extensions.filter((item) => item.status === 'enabled').length,
      disabledExtensions: extensions.filter((item) => item.status === 'disabled').length,
      availableExtensions: extensions.filter((item) => item.installState === 'not-installed')
        .length,
      updateAvailableExtensions: extensions.filter((item) => item.updateAvailable).length,
      errorExtensions: extensions.filter((item) => item.status === 'error').length,
      featuredExtensions: extensions.filter((item) => item.featured).length,
      recommendedExtensions: extensions.filter((item) => item.recommended).length,
      categories: this.getCategories(),
    }
  }

  searchExtensions(filters: MarketplaceSearchFilters = {}) {
    const query = filters.query?.trim().toLowerCase()
    let results = this.getAllExtensions()

    if (query) {
      results = results.filter((extension) =>
        [
          extension.displayName,
          extension.name,
          extension.publisher.displayName,
          extension.description,
          extension.longDescription,
          ...extension.tags,
          ...extension.categories,
        ].some((value) => value.toLowerCase().includes(query)),
      )
    }
    if (filters.categories?.length) {
      results = results.filter((extension) =>
        filters.categories?.some((category) => extension.categories.includes(category)),
      )
    }
    if (filters.statuses?.length) {
      results = results.filter((extension) => filters.statuses?.includes(extension.status))
    }
    if (filters.featured) results = results.filter((extension) => extension.featured)
    if (filters.recommended) results = results.filter((extension) => extension.recommended)
    if (filters.updatesOnly) results = results.filter((extension) => extension.updateAvailable)
    return this.sortExtensions(
      results,
      filters.sortBy ?? 'recommended',
      filters.sortOrder ?? 'desc',
    )
  }

  getFeaturedExtensions() {
    return this.searchExtensions({ featured: true, sortBy: 'recommended', sortOrder: 'desc' })
  }

  getRecommendedExtensions() {
    return this.searchExtensions({ recommended: true, sortBy: 'recommended', sortOrder: 'desc' })
  }

  getRecentlyUpdatedExtensions() {
    return this.searchExtensions({ sortBy: 'updated', sortOrder: 'desc' }).slice(0, 8)
  }

  async installExtension(extensionId: string) {
    const runtime = this.runtime
    if (!runtime?.host.capabilities.extensions?.install) {
      throw new Error('Extension installation is not supported by this host.')
    }
    await runtime.extensions.install(extensionId)
    await this.refresh()
  }

  async uninstallExtension(extensionId: string) {
    const runtime = this.runtime
    if (!runtime?.host.capabilities.extensions?.uninstall) {
      throw new Error('Extension uninstallation is not supported by this host.')
    }
    await runtime.extensions.uninstall(extensionId)
    await this.refresh()
  }

  async enableExtension(extensionId: string) {
    const runtime = this.runtime
    if (!runtime?.host.capabilities.extensions?.enable) {
      throw new Error('Extension enablement is not supported by this host.')
    }
    await runtime.extensions.enable(extensionId)
    await this.refresh()
  }

  async disableExtension(extensionId: string) {
    const runtime = this.runtime
    if (!runtime?.host.capabilities.extensions?.disable) {
      throw new Error('Extension disablement is not supported by this host.')
    }
    await runtime.extensions.disable(extensionId)
    await this.refresh()
  }

  async updateExtension(extensionId: string) {
    const extension = this.extensions.get(extensionId)
    if (!extension?.updateAvailable) throw new Error('No update is available for this extension.')
    throw new Error(
      'Extension updates are not supported until the registry installer can stage and roll back artifacts.',
    )
  }

  async installLocalPackage(input: { filePath?: string; fileName?: string; contents?: string }) {
    const runtime = this.runtime
    if (!runtime?.host.capabilities.extensions?.installFromPackage) {
      throw new Error('Local extension package installation is not supported by this host.')
    }
    if (!input.contents) throw new Error('The selected extension package has no readable content.')
    const bytes = new TextEncoder().encode(input.contents)
    await runtime.extensions.installFromPackage(bytes)
    await this.refresh()
  }

  async refresh() {
    const [{ marketplace, capabilities }, installed] = await Promise.all([
      loadCatalogSnapshot(this.backendClient),
      this.runtime?.extensions.listInstalled() ?? Promise.resolve([] as InstalledExtensionRecord[]),
    ])

    this.extensions.clear()
    const installedMap = new Map(installed.map((record) => [record.extensionId, record]))
    for (const record of marketplace) {
      const extension = makeExtension(record, installedMap.get(record.id), capabilities)
      this.extensions.set(extension.id, extension)
    }

    if (this.runtime) {
      for (const record of this.runtime.extensions.records) {
        const extension = this.extensions.get(record.extensionId)
        if (!extension) continue
        extension.runtime = record
        extension.errors = [
          ...(record.error
            ? [nowIssue(`${record.extensionId}.activate`, record.error, 'error', 'activation')]
            : []),
          ...record.surfaceErrors.map((item) =>
            nowIssue(
              `${record.extensionId}.${item.contributionId ?? item.surface}`,
              item.message,
              'error',
              item.surface,
            ),
          ),
        ]
      }
    }

    this.loaded = true
    this.loadingPromise = null
  }

  private sortExtensions(
    extensions: MarketplaceExtension[],
    sortBy: MarketplaceSortOption,
    sortOrder: 'asc' | 'desc',
  ) {
    const direction = sortOrder === 'asc' ? 1 : -1
    return extensions.slice().sort((left, right) => {
      let score = 0
      if (sortBy === 'name') score = left.displayName.localeCompare(right.displayName)
      if (sortBy === 'updated')
        score = new Date(left.lastUpdated).getTime() - new Date(right.lastUpdated).getTime()
      if (sortBy === 'downloads') score = left.downloads.total - right.downloads.total
      if (sortBy === 'rating') score = left.rating.average - right.rating.average
      if (sortBy === 'recommended') {
        score =
          Number(left.recommended) - Number(right.recommended) ||
          Number(left.featured) - Number(right.featured) ||
          left.rating.average - right.rating.average
      }
      return score * direction || left.id.localeCompare(right.id)
    })
  }
}

export const marketplaceCatalog = new MarketplaceCatalogService()

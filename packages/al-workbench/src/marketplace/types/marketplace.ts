import type {
  ActiveLaneExtensionManifest,
  WorkbenchExtensionManifest,
  WorkbenchRuntimeExtensionRecord,
} from '../../core/extensions/types'

export type MarketplaceExtensionStatus =
  | 'available'
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'update-available'

export type MarketplaceInstallState =
  | 'not-installed'
  | 'installing'
  | 'installed'
  | 'uninstalling'
  | 'updating'

export type MarketplaceSortOption = 'recommended' | 'name' | 'updated' | 'downloads' | 'rating'

export interface MarketplaceContributionPoint {
  id: string
  title: string
  description?: string
  kind?: string
}

export interface MarketplaceContributions {
  applications?: MarketplaceContributionPoint[]
  commands?: MarketplaceContributionPoint[]
  statusBar?: MarketplaceContributionPoint[]
  activityRail?: MarketplaceContributionPoint[]
  sidebarViews?: MarketplaceContributionPoint[]
  tabRenderers?: MarketplaceContributionPoint[]
  inspectorPanels?: MarketplaceContributionPoint[]
  bottomPanels?: MarketplaceContributionPoint[]
  settingsPages?: MarketplaceContributionPoint[]
  menus?: MarketplaceContributionPoint[]
  workbenchViews?: MarketplaceContributionPoint[]
  editorBlocks?: MarketplaceContributionPoint[]
  captureActions?: MarketplaceContributionPoint[]
  aiTools?: MarketplaceContributionPoint[]
}

export interface MarketplaceSetting {
  key: string
  title: string
  description: string
  type: 'boolean' | 'string' | 'number' | 'select'
  defaultValue: string | number | boolean
}

export interface MarketplaceChangelogEntry {
  version: string
  date: string
  changes: string[]
  breaking?: boolean
}

export interface MarketplaceExtensionIssue {
  id: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: string
  source?: string
}

export interface MarketplaceGalleryItem {
  title: string
  description: string
  source: string
  type: 'image' | 'video'
  altText?: string
}

export interface MarketplaceExtension {
  id: string
  name: string
  displayName: string
  publisher: {
    name: string
    displayName: string
    verified?: boolean
    official?: boolean
    website?: string
  }
  version: string
  installedVersion?: string
  description: string
  longDescription: string
  readme: string[]
  icon: string
  categories: string[]
  tags: string[]
  pricingModel: 'free' | 'one_time' | 'subscription' | 'trial' | 'enterprise'
  plans: import('../../core/extensions/types').WorkbenchSubscriptionPlan[]
  subscription?: import('../../core/entitlements/types').WorkbenchSubscription
  featured?: boolean
  recommended?: boolean
  recentlyUpdated?: boolean
  rating: {
    average: number
    count: number
  }
  downloads: {
    total: number
    weekly: number
  }
  lastUpdated: string
  firstPublished: string
  repository?: string
  homepage?: string
  status: MarketplaceExtensionStatus
  installState: MarketplaceInstallState
  updateAvailable?: {
    version: string
    releaseDate: string
    changelog: string
    critical?: boolean
  }
  contributions: MarketplaceContributions
  capabilities: string[]
  permissions: string[]
  settings: MarketplaceSetting[]
  dependencies: string[]
  changelog: MarketplaceChangelogEntry[]
  gallery: MarketplaceGalleryItem[]
  errors: MarketplaceExtensionIssue[]
  warnings: MarketplaceExtensionIssue[]
  manifest?: ActiveLaneExtensionManifest | WorkbenchExtensionManifest
  runtime?: WorkbenchRuntimeExtensionRecord
  activationEvents: string[]
  hostCompatibility: string[]
  lifecycleState?: string
  logs: Array<{ level: string; message: string; timestamp: string }>
  packageType?: 'builtin' | 'marketplace' | 'local' | 'npm' | 'url' | 'mock'
  registryId?: string
  registryDisplayName?: string
  compatibility: 'compatible' | 'incompatible'
  compatibilityReason?: string
  versionStatus?: 'draft' | 'published' | 'yanked' | 'blocked'
  integrityState?: 'verified' | 'missing' | 'invalid' | 'mismatch' | 'development'
  restartRequired?: boolean
}

export interface MarketplaceRegistryState {
  mode: 'none' | 'local-only' | 'connected'
  publicRegistryEnabled: boolean
  failures: Array<{
    registryId: string
    registryDisplayName: string
    code: string
    message: string
  }>
}

export interface MarketplaceCategory {
  id: string
  name: string
  description: string
  extensionCount: number
}

export interface MarketplaceSearchFilters {
  query?: string
  categories?: string[]
  statuses?: MarketplaceExtensionStatus[]
  featured?: boolean
  recommended?: boolean
  updatesOnly?: boolean
  pricing?: MarketplaceExtension['pricingModel'][]
  installed?: boolean
  minimumRating?: number
  verifiedPublisher?: boolean
  compatibility?: MarketplaceExtension['compatibility']
  sortBy?: MarketplaceSortOption
  sortOrder?: 'asc' | 'desc'
}

export interface MarketplaceStats {
  totalExtensions: number
  installedExtensions: number
  enabledExtensions: number
  disabledExtensions: number
  availableExtensions: number
  updateAvailableExtensions: number
  errorExtensions: number
  featuredExtensions: number
  recommendedExtensions: number
  categories: MarketplaceCategory[]
}

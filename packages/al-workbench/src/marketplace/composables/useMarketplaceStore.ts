import { computed, onMounted, ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { marketplaceCatalog } from '../services/backendMarketplaceCatalog'
import type {
  MarketplaceExtension,
  MarketplaceExtensionStatus,
  MarketplaceSearchFilters,
  MarketplaceSortOption,
} from '../types/marketplace'

export const MARKETPLACE_TAB_KIND = 'extensions.marketplace.home'
export const MARKETPLACE_DETAILS_TAB_KIND = 'extensions.marketplace.details'
export const MARKETPLACE_SURFACE_ID = 'extensions.marketplace.surface'
export const MARKETPLACE_DETAILS_SURFACE_ID = 'extensions.marketplace.details.surface'

export interface UseMarketplaceOptions {
  runtime?: WorkbenchRuntimeApi
}

const revision = ref(0)
const selectedExtensionId = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategories = ref<string[]>([])
const selectedStatuses = ref<MarketplaceExtensionStatus[]>([])
const showFeaturedOnly = ref(false)
const showRecommendedOnly = ref(false)
const updatesOnly = ref(false)
const sortBy = ref<MarketplaceSortOption>('recommended')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isLoading = ref(false)
const activeOperations = ref<
  Record<string, 'install' | 'uninstall' | 'enable' | 'disable' | 'update'>
>({})
const error = ref<string | null>(null)

function bump() {
  revision.value += 1
}

function tabTitle(extension: MarketplaceExtension) {
  return extension.displayName.length > 26
    ? `${extension.displayName.slice(0, 24)}...`
    : extension.displayName
}

export function useMarketplace(options: UseMarketplaceOptions = {}) {
  if (options.runtime) marketplaceCatalog.setRuntimeApi(options.runtime)
  if (options.runtime) {
    const configuredSort = options.runtime.settings.get<MarketplaceSortOption>(
      'extensions.marketplace.defaultSort',
    )
    if (configuredSort) sortBy.value = configuredSort
  }

  const filters = computed<MarketplaceSearchFilters>(() => {
    revision.value
    return {
      query: searchQuery.value || undefined,
      categories: selectedCategories.value.length ? selectedCategories.value : undefined,
      statuses: selectedStatuses.value.length ? selectedStatuses.value : undefined,
      featured: showFeaturedOnly.value || undefined,
      recommended: showRecommendedOnly.value || undefined,
      updatesOnly: updatesOnly.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    }
  })

  const extensions = computed(() => {
    revision.value
    return marketplaceCatalog.searchExtensions(filters.value)
  })
  const stats = computed(() => {
    revision.value
    return marketplaceCatalog.getStats()
  })
  const categories = computed(() => {
    revision.value
    return marketplaceCatalog.getCategories()
  })
  const selectedExtension = computed(() => {
    revision.value
    return selectedExtensionId.value
      ? (marketplaceCatalog.getExtension(selectedExtensionId.value) ?? null)
      : null
  })
  const featuredExtensions = computed(() => {
    revision.value
    return marketplaceCatalog.getFeaturedExtensions()
  })
  const recommendedExtensions = computed(() => {
    revision.value
    if (
      options.runtime?.settings.get<boolean>('extensions.marketplace.showRecommendations') === false
    )
      return []
    return marketplaceCatalog.getRecommendedExtensions()
  })
  const recentlyUpdatedExtensions = computed(() => {
    revision.value
    return marketplaceCatalog.getRecentlyUpdatedExtensions()
  })
  const installedExtensions = computed(() =>
    extensions.value.filter((extension) => extension.installState === 'installed'),
  )
  const availableExtensions = computed(() =>
    extensions.value.filter((extension) => extension.installState === 'not-installed'),
  )
  const enabledExtensions = computed(() =>
    extensions.value.filter(
      (extension) => extension.status === 'enabled' || extension.status === 'update-available',
    ),
  )
  const disabledExtensions = computed(() =>
    extensions.value.filter((extension) => extension.status === 'disabled'),
  )
  const errorExtensions = computed(() =>
    extensions.value.filter((extension) => extension.status === 'error'),
  )
  const updateAvailableExtensions = computed(() =>
    extensions.value.filter(
      (extension) => extension.updateAvailable && extension.installState === 'installed',
    ),
  )

  const quickFilters = computed(() => [
    { id: 'all', label: 'All', count: stats.value.totalExtensions },
    { id: 'installed', label: 'Installed', count: stats.value.installedExtensions },
    { id: 'available', label: 'Available', count: stats.value.availableExtensions },
    { id: 'enabled', label: 'Enabled', count: stats.value.enabledExtensions },
    { id: 'disabled', label: 'Disabled', count: stats.value.disabledExtensions },
    { id: 'updates', label: 'Updates', count: stats.value.updateAvailableExtensions },
    { id: 'recommended', label: 'Recommended', count: stats.value.recommendedExtensions },
    { id: 'featured', label: 'Featured', count: stats.value.featuredExtensions },
    { id: 'errors', label: 'Errors', count: stats.value.errorExtensions },
  ])

  function getExtension(extensionId: string) {
    revision.value
    return marketplaceCatalog.getExtension(extensionId) ?? null
  }

  function selectExtension(extension: MarketplaceExtension | string | null) {
    selectedExtensionId.value = typeof extension === 'string' ? extension : (extension?.id ?? null)
  }

  function openMarketplace(input?: { filter?: string; query?: string }) {
    if (options.runtime?.settings.get<boolean>('extensions.marketplace.enabled') === false) {
      void options.runtime.host.capabilities.notify?.({
        title: 'Marketplace disabled',
        message: 'Enable extensions.marketplace.enabled in Settings to browse extensions.',
        tone: 'warning',
      })
      return
    }
    if (input?.query) searchQuery.value = input.query
    if (input?.filter) applyQuickFilter(input.filter)
    options.runtime?.workbench.setActiveActivity('extensions.marketplace.activity')
    options.runtime?.workbench.setActiveSidebarView('extensions.marketplace.sidebar')
    options.runtime?.workbench.openTab({
      id: 'extensions.marketplace',
      kind: MARKETPLACE_TAB_KIND,
      surfaceId: MARKETPLACE_SURFACE_ID,
      title: 'Extensions Marketplace',
      ownerExtensionId: 'activelane.extensions-marketplace',
      pinned: true,
      preview: false,
      input: { surface: 'marketplace', filter: input?.filter, query: input?.query },
    })
  }

  function openExtensionDetails(
    extension: MarketplaceExtension | string,
    mode: 'preview' | 'persistent' = 'preview',
  ) {
    const item = typeof extension === 'string' ? getExtension(extension) : extension
    if (!item) return
    selectExtension(item)
    options.runtime?.workbench.openTab(
      {
        id: `extensions.marketplace.details.${item.id}`,
        kind: MARKETPLACE_DETAILS_TAB_KIND,
        surfaceId: MARKETPLACE_DETAILS_SURFACE_ID,
        title: tabTitle(item),
        ownerExtensionId: 'activelane.extensions-marketplace',
        pinned: false,
        input: { surface: 'details', extensionId: item.id },
      },
      { mode, source: mode === 'preview' ? 'single-click' : 'double-click' },
    )
  }

  function openExtensionSettings(extension: MarketplaceExtension) {
    selectExtension(extension)
    options.runtime?.workbench.openTab({
      id: 'workbench.settings',
      kind: 'workbench.settings',
      title: 'Settings',
      preview: false,
      input: {
        category: 'Extensions',
        extensionSettings: true,
        query: extension.id,
      },
    })
  }

  function applyQuickFilter(filterId: string) {
    selectedCategories.value = []
    selectedStatuses.value = []
    showFeaturedOnly.value = false
    showRecommendedOnly.value = false
    updatesOnly.value = false

    if (filterId === 'installed')
      selectedStatuses.value = ['installed', 'enabled', 'disabled', 'error', 'update-available']
    if (filterId === 'available') selectedStatuses.value = ['available']
    if (filterId === 'enabled') selectedStatuses.value = ['enabled', 'update-available']
    if (filterId === 'disabled') selectedStatuses.value = ['disabled']
    if (filterId === 'updates') updatesOnly.value = true
    if (filterId === 'recommended') showRecommendedOnly.value = true
    if (filterId === 'featured') showFeaturedOnly.value = true
    if (filterId === 'errors') selectedStatuses.value = ['error']
  }

  function toggleCategory(categoryId: string) {
    selectedCategories.value = selectedCategories.value.includes(categoryId)
      ? selectedCategories.value.filter((item) => item !== categoryId)
      : [...selectedCategories.value, categoryId]
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedCategories.value = []
    selectedStatuses.value = []
    showFeaturedOnly.value = false
    showRecommendedOnly.value = false
    updatesOnly.value = false
    sortBy.value = 'recommended'
    sortOrder.value = 'desc'
  }

  async function runAction(
    action: 'install' | 'uninstall' | 'enable' | 'disable' | 'update',
    extensionId: string,
  ) {
    if (options.runtime?.settings.get<boolean>('extensions.marketplace.enabled') === false) {
      throw new Error('Marketplace is disabled in Workbench Settings.')
    }
    if (activeOperations.value[extensionId]) {
      throw new Error(`An operation is already running for ${extensionId}.`)
    }
    activeOperations.value = { ...activeOperations.value, [extensionId]: action }
    isLoading.value = true
    error.value = null
    try {
      if (action === 'install') await marketplaceCatalog.installExtension(extensionId)
      if (action === 'uninstall') await marketplaceCatalog.uninstallExtension(extensionId)
      if (action === 'enable') await marketplaceCatalog.enableExtension(extensionId)
      if (action === 'disable') await marketplaceCatalog.disableExtension(extensionId)
      if (action === 'update') await marketplaceCatalog.updateExtension(extensionId)
      bump()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : `Failed to ${action} extension`
      throw caught
    } finally {
      const { [extensionId]: _, ...remaining } = activeOperations.value
      activeOperations.value = remaining
      isLoading.value = Object.keys(remaining).length > 0
    }
  }

  async function installLocalPackage() {
    const fileHandle = await options.runtime?.host.capabilities.files?.open?.()
    if (!fileHandle) return
    isLoading.value = true
    error.value = null
    try {
      await marketplaceCatalog.installLocalPackage({
        filePath: fileHandle.path,
        fileName: fileHandle.name,
        contents: fileHandle.contents,
      })
      bump()
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Failed to install local extension package'
      throw caught
    } finally {
      isLoading.value = false
    }
  }

  function refresh() {
    void marketplaceCatalog
      .refresh()
      .then(bump)
      .catch((caught) => {
        error.value = caught instanceof Error ? caught.message : 'Failed to refresh marketplace'
      })
  }

  onMounted(() => {
    void marketplaceCatalog
      .ensureLoaded()
      .then(bump)
      .catch((caught) => {
        error.value =
          caught instanceof Error ? caught.message : 'Failed to load marketplace catalog'
      })
  })

  return {
    isLoading,
    activeOperations,
    error,
    searchQuery,
    selectedCategories,
    selectedStatuses,
    showFeaturedOnly,
    showRecommendedOnly,
    updatesOnly,
    sortBy,
    sortOrder,
    filters,
    extensions,
    stats,
    categories,
    selectedExtension,
    featuredExtensions,
    recommendedExtensions,
    recentlyUpdatedExtensions,
    installedExtensions,
    availableExtensions,
    enabledExtensions,
    disabledExtensions,
    errorExtensions,
    updateAvailableExtensions,
    quickFilters,
    getExtension,
    selectExtension,
    openMarketplace,
    openExtensionDetails,
    openExtensionSettings,
    applyQuickFilter,
    toggleCategory,
    clearFilters,
    refresh,
    setSorting(option: MarketplaceSortOption, order: 'asc' | 'desc' = 'desc') {
      sortBy.value = option
      sortOrder.value = order
    },
    installLocalPackage,
    installExtension: (extensionId: string) => runAction('install', extensionId),
    uninstallExtension: (extensionId: string) => runAction('uninstall', extensionId),
    enableExtension: (extensionId: string) => runAction('enable', extensionId),
    disableExtension: (extensionId: string) => runAction('disable', extensionId),
    updateExtension: (extensionId: string) => runAction('update', extensionId),
  }
}

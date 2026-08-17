<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { type MarketplacePage, useMarketplace } from '../composables/useMarketplaceStore'
import MarketplaceSidebarItem from '../sidebar/MarketplaceSidebarItem.vue'
import MarketplaceSidebarSection from '../sidebar/MarketplaceSidebarSection.vue'
import type { MarketplaceExtension } from '../types/marketplace'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [AlDropdownMenu, AlInput] = props.runtime.workbench.ui.getComponents([
  'AlDropdownMenu',
  'AlInput',
])
const [Filter, MoreHorizontal, RefreshCcw, Search, X] = props.runtime.workbench.ui.getIcons([
  'Filter',
  'MoreHorizontal',
  'RefreshCcw',
  'Search',
  'X',
])

const installedOpen = ref(true)
const updatesOpen = ref(true)
const recommendedOpen = ref(true)
const popularOpen = ref(false)
const searching = computed(() => marketplace.searchQuery.value.trim().length > 0)
const installed = computed(() =>
  marketplace.extensions.value.filter((extension) => extension.installState === 'installed'),
)
const updates = computed(() => marketplace.updateAvailableExtensions.value)
const recommended = computed(() =>
  marketplace.recommendedExtensions.value
    .filter((extension) => extension.installState !== 'installed')
    .slice(0, 8),
)
const popular = computed(() =>
  marketplace.extensions.value
    .filter((extension) => extension.installState !== 'installed')
    .slice()
    .sort((left, right) => right.downloads.total - left.downloads.total)
    .slice(0, 6),
)

const navigationItems = computed(() => [
  { id: 'discover', label: 'Open Discover' },
  { id: 'browse', label: 'Browse all extensions' },
  { id: 'installed', label: 'Manage installed extensions' },
  { id: 'updates', label: 'Review updates' },
  { id: 'subscriptions', label: 'Manage subscriptions' },
  { id: 'separator', label: '' },
  { id: 'refresh', label: 'Refresh Marketplace' },
  { id: 'clear', label: 'Clear search', disabled: !searching.value },
])
const filterItems = computed(() => [
  {
    id: 'verified',
    label: 'Verified publishers',
    checked: marketplace.verifiedPublisherOnly.value,
  },
  {
    id: 'compatible',
    label: 'Compatible only',
    checked: marketplace.compatibilityFilter.value === 'compatible',
  },
  { id: 'separator', label: '' },
  { id: 'free', label: 'Free', checked: marketplace.pricingFilter.value === 'free' },
  {
    id: 'subscription',
    label: 'Subscription',
    checked: marketplace.pricingFilter.value === 'subscription',
  },
  { id: 'all-pricing', label: 'Any pricing', checked: marketplace.pricingFilter.value === 'all' },
])

function navigate(page: MarketplacePage) {
  marketplace.setPage(page)
  marketplace.openMarketplace()
}

function handleNavigation(id: string) {
  if (id === 'refresh') marketplace.refresh()
  else if (id === 'clear') marketplace.searchQuery.value = ''
  else navigate(id as MarketplacePage)
}

function handleFilter(id: string) {
  if (id === 'verified')
    marketplace.verifiedPublisherOnly.value = !marketplace.verifiedPublisherOnly.value
  if (id === 'compatible') {
    marketplace.compatibilityFilter.value =
      marketplace.compatibilityFilter.value === 'compatible' ? 'all' : 'compatible'
  }
  if (id === 'free' || id === 'subscription') {
    marketplace.pricingFilter.value = marketplace.pricingFilter.value === id ? 'all' : id
  }
  if (id === 'all-pricing') marketplace.pricingFilter.value = 'all'
}

function selectExtension(extension: MarketplaceExtension) {
  marketplace.selectExtension(extension)
  marketplace.openExtensionDetails(extension, 'persistent')
}

async function runAction(
  extension: MarketplaceExtension,
  action: 'install' | 'open' | 'update' | 'enable' | 'subscribe',
) {
  try {
    if (action === 'install') await marketplace.installExtension(extension.id)
    if (action === 'open') await marketplace.openExtension(extension)
    if (action === 'update') await marketplace.updateExtension(extension.id)
    if (action === 'enable') await marketplace.enableExtension(extension.id)
    if (action === 'subscribe') selectExtension(extension)
  } catch (error) {
    await props.runtime.host.capabilities.notify?.({
      title: `Could not update ${extension.displayName}`,
      message: error instanceof Error ? error.message : String(error),
      tone: 'error',
    })
  }
}

async function manage(extension: MarketplaceExtension, action: string) {
  if (action === 'manage') selectExtension(extension)
  if (action === 'open') await marketplace.openExtension(extension)
  if (action === 'enable') await marketplace.enableExtension(extension.id)
  if (action === 'disable') await marketplace.disableExtension(extension.id)
  if (action === 'update') await runAction(extension, 'update')
  if (action === 'uninstall') await marketplace.uninstallExtension(extension.id)
}
</script>

<template>
  <div class="marketplace-sidebar-navigator">
    <header class="sidebar-navigator-header">
      <strong>Marketplace</strong>
      <div>
        <button type="button" aria-label="Refresh Marketplace" @click="marketplace.refresh()">
          <RefreshCcw />
        </button>
        <AlDropdownMenu :items="navigationItems" class="w-52" @select="handleNavigation">
          <template #trigger>
            <button type="button" aria-label="Marketplace actions"><MoreHorizontal /></button>
          </template>
        </AlDropdownMenu>
      </div>
    </header>

    <div class="sidebar-search">
      <Search aria-hidden="true" />
      <AlInput
        v-model="marketplace.searchQuery.value"
        aria-label="Search Marketplace"
        placeholder="Search apps and extensions"
      />
      <button
        v-if="searching"
        type="button"
        class="search-clear"
        aria-label="Clear Marketplace search"
        @click="marketplace.searchQuery.value = ''"
      >
        <X />
      </button>
      <AlDropdownMenu :items="filterItems" class="w-48" @select="handleFilter">
        <template #trigger>
          <button type="button" class="search-filter" aria-label="Filter Marketplace results">
            <Filter />
          </button>
        </template>
      </AlDropdownMenu>
    </div>

    <div v-if="marketplace.registryState.value.failures.length" class="sidebar-registry-error">
      <span>Some registries are unavailable.</span>
      <button type="button" @click="marketplace.refresh()">Retry</button>
    </div>

    <div class="sidebar-navigator-content">
      <template v-if="marketplace.isLoading.value && !marketplace.extensions.value.length">
        <div v-for="index in 6" :key="index" class="sidebar-row-skeleton">
          <i />
          <div><b /><span /><span /></div>
        </div>
      </template>

      <MarketplaceSidebarSection
        v-else-if="searching"
        :runtime="runtime"
        title="Search results"
        :count="marketplace.extensions.value.length"
        :open="true"
      >
        <MarketplaceSidebarItem
          v-for="extension in marketplace.extensions.value"
          :key="extension.id"
          :runtime="runtime"
          :extension="extension"
          mode="search"
          :selected="marketplace.selectedExtension.value?.id === extension.id"
          @select="selectExtension(extension)"
          @action="runAction(extension, $event)"
        />
        <div v-if="!marketplace.extensions.value.length" class="sidebar-empty">
          No extensions found for “{{ marketplace.searchQuery.value }}”.
        </div>
      </MarketplaceSidebarSection>

      <template v-else>
        <MarketplaceSidebarSection
          :runtime="runtime"
          title="Installed"
          :count="installed.length"
          :open="installedOpen"
          @toggle="installedOpen = !installedOpen"
        >
          <MarketplaceSidebarItem
            v-for="extension in installed"
            :key="extension.id"
            :runtime="runtime"
            :extension="extension"
            mode="installed"
            :selected="marketplace.selectedExtension.value?.id === extension.id"
            @select="selectExtension(extension)"
            @manage="manage(extension, $event)"
          />
          <div v-if="!installed.length" class="sidebar-empty">
            No extensions installed.
            <button type="button" @click="navigate('discover')">Explore Marketplace</button>
          </div>
        </MarketplaceSidebarSection>

        <MarketplaceSidebarSection
          :runtime="runtime"
          title="Updates"
          :count="updates.length"
          :open="updatesOpen"
          @toggle="updatesOpen = !updatesOpen"
        >
          <MarketplaceSidebarItem
            v-for="extension in updates"
            :key="extension.id"
            :runtime="runtime"
            :extension="extension"
            mode="update"
            :selected="marketplace.selectedExtension.value?.id === extension.id"
            @select="selectExtension(extension)"
            @action="runAction(extension, $event)"
          />
          <div v-if="!updates.length" class="sidebar-empty compact">Everything is up to date.</div>
        </MarketplaceSidebarSection>

        <MarketplaceSidebarSection
          :runtime="runtime"
          title="Recommended"
          :count="recommended.length || undefined"
          :open="recommendedOpen"
          @toggle="recommendedOpen = !recommendedOpen"
        >
          <MarketplaceSidebarItem
            v-for="extension in recommended"
            :key="extension.id"
            :runtime="runtime"
            :extension="extension"
            mode="recommended"
            :selected="marketplace.selectedExtension.value?.id === extension.id"
            @select="selectExtension(extension)"
            @action="runAction(extension, $event)"
          />
          <div v-if="!recommended.length" class="sidebar-empty compact">
            No recommendations available.
          </div>
        </MarketplaceSidebarSection>

        <MarketplaceSidebarSection
          v-if="popular.length"
          :runtime="runtime"
          title="Popular"
          :count="popular.length"
          :open="popularOpen"
          @toggle="popularOpen = !popularOpen"
        >
          <MarketplaceSidebarItem
            v-for="extension in popular"
            :key="extension.id"
            :runtime="runtime"
            :extension="extension"
            mode="recommended"
            :selected="marketplace.selectedExtension.value?.id === extension.id"
            @select="selectExtension(extension)"
            @action="runAction(extension, $event)"
          />
        </MarketplaceSidebarSection>
      </template>
    </div>

    <footer>
      <span>{{ marketplace.stats.value.totalExtensions }} apps</span>
      <button type="button" @click="marketplace.installLocalPackage()">
        Install local package
      </button>
    </footer>
  </div>
</template>

<style scoped>
.marketplace-sidebar-navigator {
  container-type: inline-size;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: 34px auto auto minmax(0, 1fr) 27px;
  overflow: hidden;
  background: var(--pane-surface);
  color: var(--foreground);
}
.sidebar-navigator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 7px 0 9px;
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-surface);
}
.sidebar-navigator-header strong {
  font-size: 10px;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}
.sidebar-navigator-header > div {
  display: flex;
  gap: 1px;
}
.sidebar-navigator-header button {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.sidebar-navigator-header button:hover {
  background: var(--hover);
  color: var(--foreground);
}
.sidebar-navigator-header svg {
  width: 13px;
}
.sidebar-search {
  position: relative;
  margin: 7px;
}
.sidebar-search > svg {
  position: absolute;
  z-index: 1;
  left: 8px;
  top: 8px;
  width: 13px;
  color: var(--text-muted);
}
.sidebar-search :deep(input) {
  height: 29px;
  padding: 0 49px 0 27px;
  border-color: var(--border);
  border-radius: 4px;
  background: var(--pane-inset);
  font-size: 10px;
}
.sidebar-search :deep(input:focus) {
  border-color: var(--focus-ring);
}
.search-clear,
.search-filter {
  position: absolute;
  top: 3px;
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.search-clear {
  right: 27px;
}
.search-filter {
  right: 3px;
}
.search-clear:hover,
.search-filter:hover {
  background: var(--hover);
  color: var(--foreground);
}
.search-clear svg,
.search-filter svg {
  width: 12px;
}
.sidebar-registry-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-top: 1px solid var(--warning);
  border-bottom: 1px solid var(--warning);
  background: color-mix(in srgb, var(--warning) 8%, transparent);
  color: var(--text-muted);
  font-size: 8px;
}
.sidebar-registry-error button {
  border: 0;
  background: transparent;
  color: var(--foreground);
  font-size: 8px;
  cursor: pointer;
}
.sidebar-navigator-content {
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
}
.sidebar-empty {
  display: grid;
  gap: 5px;
  padding: 16px 10px;
  color: var(--text-muted);
  font-size: 9px;
  text-align: center;
}
.sidebar-empty.compact {
  padding: 10px;
}
.sidebar-empty button {
  justify-self: center;
  border: 0;
  background: transparent;
  color: var(--foreground);
  font-size: 9px;
  cursor: pointer;
}
.sidebar-empty button:hover {
  text-decoration: underline;
}
.sidebar-row-skeleton {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 8px;
  padding: 8px;
}
.sidebar-row-skeleton i {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--pane-inset);
  animation: pulse 1.4s ease-in-out infinite;
}
.sidebar-row-skeleton div {
  display: grid;
  gap: 4px;
}
.sidebar-row-skeleton b,
.sidebar-row-skeleton span {
  height: 6px;
  border-radius: 3px;
  background: var(--pane-inset);
  animation: pulse 1.4s ease-in-out infinite;
}
.sidebar-row-skeleton b {
  width: 55%;
}
.sidebar-row-skeleton span:last-child {
  width: 35%;
}
@keyframes pulse {
  50% {
    opacity: 0.45;
  }
}
.marketplace-sidebar-navigator > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-top: 1px solid var(--border);
  background: var(--toolbar-surface);
  color: var(--text-muted);
  font-size: 8px;
}
.marketplace-sidebar-navigator > footer button {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 8px;
  cursor: pointer;
}
.marketplace-sidebar-navigator > footer button:hover {
  color: var(--foreground);
}
@container (max-width: 280px) {
  .marketplace-sidebar-navigator > footer button {
    display: none;
  }
}
</style>

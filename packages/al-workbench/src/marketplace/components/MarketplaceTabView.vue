<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'

import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension, MarketplaceSortOption } from '../types/marketplace'
import {
  extensionIcon,
  formatCount,
  formatDate,
  primaryAction,
  statusLabel,
  statusTone,
} from './MarketplaceShared'

defineOptions({ name: 'MarketplaceTabView' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const [
  AlBadge,
  AlButton,
  AlCard,
  AlEmptyState,
  AlInput,
  AlSection,
  AlSectionHeader,
  AlSelect,
  AlStatBlock,
] = props.runtime.workbench.ui.getComponents([
  'AlBadge',
  'AlButton',
  'AlCard',
  'AlEmptyState',
  'AlInput',
  'AlSection',
  'AlSectionHeader',
  'AlSelect',
  'AlStatBlock',
])

const [AlertCircle, Check, Layers3, RefreshCcw, Search, Settings, Sparkles, Star] =
  props.runtime.workbench.ui.getIcons([
    'AlertCircle',
    'Check',
    'Layers3',
    'RefreshCcw',
    'Search',
    'Settings',
    'Sparkles',
    'Star',
  ])

const marketplace = useMarketplace({ runtime: props.runtime })

const sortOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Name', value: 'name' },
  { label: 'Recently updated', value: 'updated' },
  { label: 'Install count', value: 'downloads' },
  { label: 'Rating', value: 'rating' },
]

const healthTone = computed(() => {
  if (marketplace.stats.value.errorExtensions) return 'destructive'
  if (marketplace.stats.value.updateAvailableExtensions) return 'warning'
  return 'success'
})

function setSort(value: string) {
  marketplace.setSorting(value as MarketplaceSortOption, value === 'name' ? 'asc' : 'desc')
}

async function runPrimary(extension: MarketplaceExtension) {
  const action = primaryAction(extension).action
  if (action === 'details') marketplace.openExtensionDetails(extension)
  if (action === 'settings') marketplace.openExtensionSettings(extension)
  if (action === 'install') await marketplace.installExtension(extension.id)
  if (action === 'update') await marketplace.updateExtension(extension.id)
  if (action === 'enable') await marketplace.enableExtension(extension.id)
  if (action === 'disable') await marketplace.disableExtension(extension.id)
}
</script>

<template>
  <section class="h-full min-h-0 overflow-auto bg-background">
    <div class="mx-auto grid max-w-7xl gap-5 p-5">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Extensions Marketplace
          </p>
          <h1 class="m-0 mt-1 text-2xl font-semibold tracking-tight">{{ tab.title }}</h1>
          <p class="m-0 mt-1 max-w-3xl text-sm text-muted-foreground">
            Browse first-party and provider catalog entries, inspect manifest contribution points,
            and manage local extension lifecycle state.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <AlButton
            variant="outline"
            :leading-icon="RefreshCcw"
            :loading="marketplace.isLoading.value"
            @click="marketplace.refresh()"
          >
            Refresh
          </AlButton>
          <AlButton
            variant="outline"
            :leading-icon="Search"
            :loading="marketplace.isLoading.value"
            @click="marketplace.installLocalPackage()"
          >
            Install from local package
          </AlButton>
          <AlButton
            :leading-icon="Settings"
            @click="marketplace.openMarketplace({ filter: 'installed' })"
            >Manage Installed</AlButton
          >
        </div>
      </header>

      <div class="grid gap-3 md:grid-cols-5">
        <AlStatBlock label="Installed" :value="marketplace.stats.value.installedExtensions" />
        <AlStatBlock label="Enabled" :value="marketplace.stats.value.enabledExtensions" />
        <AlStatBlock label="Available" :value="marketplace.stats.value.availableExtensions" />
        <AlStatBlock label="Updates" :value="marketplace.stats.value.updateAvailableExtensions" />
        <AlStatBlock label="Errors" :value="marketplace.stats.value.errorExtensions" />
      </div>

      <AlCard
        v-if="marketplace.registryState.value.mode !== 'connected' || marketplace.registryState.value.failures.length"
        class="grid gap-2 p-4"
      >
        <div class="flex flex-wrap items-center gap-2">
          <AlBadge :tone="marketplace.registryState.value.failures.length ? 'warning' : 'info'">
            {{ marketplace.registryState.value.mode === 'none' ? 'No registries configured' : marketplace.registryState.value.mode === 'local-only' ? 'Local-only mode' : 'Some registries unavailable' }}
          </AlBadge>
          <AlBadge v-if="!marketplace.registryState.value.publicRegistryEnabled" variant="outline">
            Public registry disabled
          </AlBadge>
        </div>
        <p
          v-for="failure in marketplace.registryState.value.failures"
          :key="failure.registryId"
          class="m-0 text-sm text-muted-foreground"
        >
          {{ failure.registryDisplayName }}: {{ failure.message }} ({{ failure.code }})
        </p>
      </AlCard>

      <AlCard class="grid gap-3 p-3">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_8rem]">
          <div class="relative">
            <Search
              class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <AlInput
              v-model="marketplace.searchQuery.value"
              class="pl-8"
              placeholder="Search extensions, publishers, descriptions, tags"
            />
          </div>
          <AlSelect
            :model-value="marketplace.sortBy.value"
            :options="sortOptions"
            @update:model-value="setSort"
          />
          <AlButton
            variant="outline"
            @click="marketplace.sortOrder.value = marketplace.sortOrder.value === 'desc' ? 'asc' : 'desc'"
          >
            {{ marketplace.sortOrder.value === 'desc' ? 'Descending' : 'Ascending' }}
          </AlButton>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <AlButton
            v-for="filter in marketplace.quickFilters.value"
            :key="filter.id"
            size="sm"
            variant="outline"
            @click="marketplace.applyQuickFilter(filter.id)"
          >
            {{ filter.label }}
            <AlBadge variant="outline" class="ml-1">{{ filter.count }}</AlBadge>
          </AlButton>
        </div>
      </AlCard>

      <AlCard class="grid gap-4 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="m-0 text-base font-semibold">Extension Health</h2>
            <p class="m-0 mt-1 text-sm text-muted-foreground">
              Runtime records, catalog status, update scaffolds, and surface errors.
            </p>
          </div>
          <AlBadge :tone="healthTone" size="md">
            {{ marketplace.stats.value.errorExtensions ? 'Needs attention' : marketplace.stats.value.updateAvailableExtensions ? 'Updates available' : 'Healthy' }}
          </AlBadge>
        </div>
        <p v-if="marketplace.error.value" class="m-0 text-sm text-destructive">
          {{ marketplace.error.value }}
        </p>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="rounded-md border border-border p-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <Check class="size-4" />
              Installed Summary
            </div>
            <p class="m-0 mt-2 text-sm text-muted-foreground">
              {{ marketplace.stats.value.enabledExtensions }}
              enabled, {{ marketplace.stats.value.disabledExtensions }} disabled.
            </p>
          </div>
          <div class="rounded-md border border-border p-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <RefreshCcw class="size-4" />
              Update Status
            </div>
            <p class="m-0 mt-2 text-sm text-muted-foreground">
              {{ marketplace.stats.value.updateAvailableExtensions }}
              extension updates are ready to apply locally.
            </p>
          </div>
          <div class="rounded-md border border-border p-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <AlertCircle class="size-4" />
              Runtime Issues
            </div>
            <p class="m-0 mt-2 text-sm text-muted-foreground">
              {{ marketplace.stats.value.errorExtensions }}
              extensions currently report errors.
            </p>
          </div>
        </div>
      </AlCard>

      <AlSection>
        <AlSectionHeader
          title="Featured Extensions"
          description="First-party and high-signal extensions for proving the platform."
        />
        <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AlCard
            v-for="extension in marketplace.featuredExtensions.value.slice(0, 6)"
            :key="extension.id"
            class="grid cursor-pointer gap-3 p-4 transition-colors hover:bg-muted/50"
            @click="marketplace.openExtensionDetails(extension)"
            @dblclick="marketplace.openExtensionDetails(extension, 'persistent')"
          >
            <div class="flex items-start gap-3">
              <div class="grid size-10 place-items-center rounded-md border border-border bg-muted">
                <component :is="extensionIcon(extension)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                  <h3 class="m-0 truncate text-sm font-semibold">{{ extension.displayName }}</h3>
                  <AlBadge :tone="statusTone(extension)">{{ statusLabel(extension) }}</AlBadge>
                </div>
                <p class="m-0 mt-0.5 truncate text-xs text-muted-foreground">
                  {{ extension.publisher.displayName }}
                  · {{ extension.pricingModel === 'free' ? 'Free' : extension.pricingModel }}
                  · v{{ extension.version }}
                </p>
              </div>
            </div>
            <p class="m-0 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {{ extension.description }}
            </p>
            <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span
                ><Star class="mr-1 inline size-3.5" />{{ extension.rating.average.toFixed(1) }}
                · {{ extension.rating.count }}</span
              >
              <span>{{ formatCount(extension.downloads.total) }} installs</span>
            </div>
            <AlButton
              :variant="primaryAction(extension).variant"
              size="sm"
              @click.stop="runPrimary(extension)"
            >
              {{ primaryAction(extension).label }}
            </AlButton>
          </AlCard>
        </div>
      </AlSection>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <AlSection>
          <AlSectionHeader
            title="Available Catalog"
            :description="`${marketplace.extensions.value.length} extensions match the current filters.`"
          />
          <div v-if="marketplace.extensions.value.length === 0" class="mt-3">
            <AlEmptyState
              title="No extensions found"
              description="Try another search term or clear filters."
              :icon="Search"
            />
          </div>
          <div v-else class="mt-3 grid gap-2">
            <AlCard
              v-for="extension in marketplace.extensions.value"
              :key="extension.id"
              class="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <button
                type="button"
                class="flex min-w-0 items-start gap-3 text-left"
                @click="marketplace.openExtensionDetails(extension)"
              >
                <div
                  class="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted"
                >
                  <component :is="extensionIcon(extension)" class="size-4" />
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="m-0 text-sm font-semibold">{{ extension.displayName }}</h3>
                    <AlBadge :tone="statusTone(extension)">{{ statusLabel(extension) }}</AlBadge>
                    <AlBadge variant="outline"
                      >{{ extension.pricingModel === 'free' ? 'Free' : extension.pricingModel }}</AlBadge
                    >
                    <AlBadge v-if="extension.featured" variant="secondary">Featured</AlBadge>
                    <AlBadge v-if="extension.recommended" variant="outline">Recommended</AlBadge>
                  </div>
                  <p class="m-0 mt-0.5 text-xs text-muted-foreground">
                    {{ extension.publisher.displayName }}
                    · v{{ extension.version }}
                    · {{ extension.categories.join(', ') }} · updated
                    {{ formatDate(extension.lastUpdated) }}
                  </p>
                  <p class="m-0 mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {{ extension.description }}
                  </p>
                </div>
              </button>
              <div class="flex items-center gap-2 md:justify-end">
                <AlButton
                  variant="ghost"
                  size="sm"
                  @click="marketplace.openExtensionDetails(extension)"
                  >Details</AlButton
                >
                <AlButton
                  :variant="primaryAction(extension).variant"
                  size="sm"
                  @click="runPrimary(extension)"
                >
                  {{ primaryAction(extension).label }}
                </AlButton>
              </div>
            </AlCard>
          </div>
        </AlSection>

        <aside class="grid content-start gap-4">
          <AlSection>
            <AlSectionHeader title="Categories" />
            <div class="mt-3 grid gap-2">
              <button
                v-for="category in marketplace.categories.value"
                :key="category.id"
                type="button"
                class="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                @click="marketplace.toggleCategory(category.id)"
              >
                <span>{{ category.name }}</span>
                <AlBadge variant="outline">{{ category.extensionCount }}</AlBadge>
              </button>
            </div>
          </AlSection>

          <AlSection>
            <AlSectionHeader title="Recently Updated" />
            <div class="mt-3 grid gap-2">
              <button
                v-for="extension in marketplace.recentlyUpdatedExtensions.value.slice(0, 5)"
                :key="extension.id"
                type="button"
                class="rounded-md border border-border p-3 text-left hover:bg-muted"
                @click="marketplace.openExtensionDetails(extension)"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-sm font-medium">{{ extension.displayName }}</span>
                  <AlBadge v-if="extension.updateAvailable" tone="warning">Update</AlBadge>
                </div>
                <p class="m-0 mt-1 text-xs text-muted-foreground">
                  {{ formatDate(extension.lastUpdated) }}
                </p>
              </button>
            </div>
          </AlSection>
        </aside>
      </div>
    </div>
  </section>
</template>

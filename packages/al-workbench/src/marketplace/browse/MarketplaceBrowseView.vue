<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import MarketplaceAppCard from '../components/MarketplaceAppCard.vue'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceSortOption } from '../types/marketplace'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [AlButton, AlSelect] = props.runtime.workbench.ui.getComponents(['AlButton', 'AlSelect'])
const Search = props.runtime.workbench.ui.getIcon('lucide.search')
const X = props.runtime.workbench.ui.getIcon('lucide.x')
const sortOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Recently updated', value: 'updated' },
  { label: 'Most installed', value: 'downloads' },
  { label: 'Rating', value: 'rating' },
  { label: 'Name', value: 'name' },
]
const priceOptions = [
  { label: 'Any price', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'One-time purchase', value: 'one_time' },
  { label: 'Trial', value: 'trial' },
]
function setSort(value: string) {
  marketplace.setSorting(value as MarketplaceSortOption, value === 'name' ? 'asc' : 'desc')
}
</script>

<template>
  <div class="browse-view">
    <header class="browse-heading">
      <div>
        <span>{{ marketplace.searchQuery.value ? 'Search results' : 'Browse marketplace' }}</span>
        <h1>
          {{ marketplace.searchQuery.value ? `Results for “${marketplace.searchQuery.value}”` : 'Apps and extensions' }}
        </h1>
        <p>
          {{ marketplace.extensions.value.length }}
          {{ marketplace.extensions.value.length === 1 ? 'result' : 'results' }}
          from connected registries
        </p>
      </div>
    </header>
    <div class="browse-toolbar">
      <div class="filter-group">
        <AlSelect
          :model-value="marketplace.sortBy.value"
          :options="sortOptions"
          @update:model-value="setSort"
        /><AlSelect v-model="marketplace.pricingFilter.value" :options="priceOptions" />
        <AlButton
          size="sm"
          variant="outline"
          :aria-pressed="marketplace.verifiedPublisherOnly.value"
          @click="marketplace.verifiedPublisherOnly.value = !marketplace.verifiedPublisherOnly.value"
          >Verified only</AlButton
        >
      </div>
      <AlButton size="sm" variant="ghost" :leading-icon="X" @click="marketplace.clearFilters()"
        >Clear</AlButton
      >
    </div>
    <div v-if="marketplace.selectedCategories.value.length" class="active-filters">
      <button
        v-for="category in marketplace.selectedCategories.value"
        :key="category"
        type="button"
        @click="marketplace.toggleCategory(category)"
      >
        {{ category }} <X />
      </button>
    </div>
    <div v-if="marketplace.extensions.value.length" class="browse-results">
      <MarketplaceAppCard
        v-for="extension in marketplace.extensions.value"
        :key="extension.id"
        :runtime="runtime"
        :extension="extension"
        compact
      />
    </div>
    <div v-else class="browse-empty">
      <div class="empty-icon"><Search /></div>
      <h2>
        No extensions found<span v-if="marketplace.searchQuery.value">
          for “{{ marketplace.searchQuery.value }}”</span
        >
      </h2>
      <p>Try another term or remove filters to broaden the catalog.</p>
      <AlButton variant="outline" @click="marketplace.clearFilters()">Clear filters</AlButton>
    </div>
  </div>
</template>

<style scoped>
.browse-view {
  padding: 28px 32px 48px;
}
.browse-heading span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.browse-heading h1 {
  margin: 5px 0 3px;
  font-size: 22px;
  letter-spacing: -0.02em;
}
.browse-heading p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.browse-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 22px 0 12px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.filter-group {
  display: flex;
  gap: 7px;
}
.filter-group :deep(button),
.filter-group :deep([role="combobox"]) {
  height: 29px;
  font-size: 11px;
}
.active-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.active-filters button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 0;
  border-radius: 5px;
  background: var(--accent);
  color: var(--accent-foreground);
  font-size: 10px;
  text-transform: capitalize;
}
.active-filters svg {
  width: 11px;
}
.browse-results {
  display: grid;
  gap: 7px;
}
.browse-empty {
  display: grid;
  justify-items: center;
  padding: 90px 20px;
  text-align: center;
}
.empty-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: var(--muted);
}
.empty-icon svg {
  width: 20px;
  color: var(--muted-foreground);
}
.browse-empty h2 {
  margin: 16px 0 5px;
  font-size: 15px;
}
.browse-empty p {
  margin: 0 0 16px;
  color: var(--muted-foreground);
  font-size: 12px;
}
@media (max-width: 760px) {
  .browse-view {
    padding: 20px 16px;
  }
  .browse-toolbar,
  .filter-group {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

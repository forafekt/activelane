<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import MarketplaceBrowseView from '../browse/MarketplaceBrowseView.vue'
import { useMarketplace } from '../composables/useMarketplaceStore'
import MarketplaceDiscoverView from '../discover/MarketplaceDiscoverView.vue'
import MarketplaceInstalledView from '../installed/MarketplaceInstalledView.vue'
import MarketplaceSubscriptionsView from '../subscriptions/MarketplaceSubscriptionsView.vue'
import MarketplaceUpdatesView from '../updates/MarketplaceUpdatesView.vue'
import MarketplaceHeader from './MarketplaceHeader.vue'
import MarketplaceNavigation from './MarketplaceNavigation.vue'

defineOptions({ name: 'MarketplaceTabView' })
const props = defineProps<{ tab: WorkbenchTab; runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const inputFilter = typeof props.tab.input?.filter === 'string' ? props.tab.input.filter : undefined
const inputQuery = typeof props.tab.input?.query === 'string' ? props.tab.input.query : undefined
if (inputQuery) {
  marketplace.searchQuery.value = inputQuery
  marketplace.setPage('browse')
}
if (inputFilter === 'installed') marketplace.setPage('installed')
if (inputFilter === 'updates') marketplace.setPage('updates')
</script>

<template>
  <section class="marketplace-app">
    <MarketplaceHeader :runtime="runtime" @search="marketplace.setPage('browse')" />
    <div class="marketplace-workspace">
      <MarketplaceNavigation :runtime="runtime" />
      <main class="marketplace-content" tabindex="-1">
        <MarketplaceDiscoverView
          v-if="marketplace.activePage.value === 'discover'"
          :runtime="runtime"
        />
        <MarketplaceBrowseView
          v-else-if="marketplace.activePage.value === 'browse'"
          :runtime="runtime"
        />
        <MarketplaceInstalledView
          v-else-if="marketplace.activePage.value === 'installed'"
          :runtime="runtime"
        />
        <MarketplaceUpdatesView
          v-else-if="marketplace.activePage.value === 'updates'"
          :runtime="runtime"
        />
        <MarketplaceSubscriptionsView v-else :runtime="runtime" />
      </main>
    </div>
  </section>
</template>

<style scoped>
.marketplace-app {
  container-type: inline-size;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  background: var(--background);
  color: var(--foreground);
}
.marketplace-workspace {
  display: grid;
  min-height: 0;
  grid-template-columns: 190px minmax(0, 1fr);
}
.marketplace-content {
  min-width: 0;
  overflow: auto;
  scroll-behavior: smooth;
}
@media (max-width: 760px) {
  .marketplace-workspace {
    grid-template-columns: 1fr;
  }
  .marketplace-workspace > :first-child {
    display: none;
  }
}
@container (max-width: 820px) {
  .marketplace-workspace {
    grid-template-columns: 1fr;
  }
  .marketplace-workspace > :first-child {
    display: none;
  }
}
</style>

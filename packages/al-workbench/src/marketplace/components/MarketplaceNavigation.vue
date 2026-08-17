<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { type MarketplacePage, useMarketplace } from '../composables/useMarketplaceStore'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const Compass = props.runtime.workbench.ui.getIcon('lucide.compass')
const Grid2X2 = props.runtime.workbench.ui.getIcon('lucide.grid-2x2')
const Download = props.runtime.workbench.ui.getIcon('lucide.download')
const RefreshCcw = props.runtime.workbench.ui.getIcon('lucide.refresh-ccw')
const WalletCards = props.runtime.workbench.ui.getIcon('lucide.wallet-cards')
const primary: Array<{ id: MarketplacePage; label: string; icon: unknown }> = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'browse', label: 'Browse', icon: Grid2X2 },
  { id: 'installed', label: 'Installed', icon: Download },
  { id: 'updates', label: 'Updates', icon: RefreshCcw },
  { id: 'subscriptions', label: 'Subscriptions', icon: WalletCards },
]
</script>

<template>
  <nav class="marketplace-navigation" aria-label="Marketplace">
    <div class="marketplace-nav-group">
      <button
        v-for="item in primary"
        :key="item.id"
        type="button"
        :class="{ active: marketplace.activePage.value === item.id }"
        @click="marketplace.setPage(item.id)"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
        <em v-if="item.id === 'installed'">{{ marketplace.stats.value.installedExtensions }}</em>
        <em v-if="item.id === 'updates' && marketplace.stats.value.updateAvailableExtensions"
          >{{ marketplace.stats.value.updateAvailableExtensions }}</em
        >
      </button>
    </div>
    <div class="marketplace-nav-heading">Categories</div>
    <div class="marketplace-nav-categories">
      <button
        v-for="category in marketplace.categories.value.filter((item) => item.extensionCount)"
        :key="category.id"
        type="button"
        @click="marketplace.clearFilters(); marketplace.toggleCategory(category.id); marketplace.setPage('browse')"
      >
        <span>{{ category.name }}</span><em>{{ category.extensionCount }}</em>
      </button>
    </div>
    <div class="marketplace-nav-footer">
      <span
        >{{ marketplace.registryState.value.mode === 'connected' ? 'Registry connected' : 'Limited catalog' }}</span
      >
      <i :class="{ online: marketplace.registryState.value.mode === 'connected' }" />
    </div>
  </nav>
</template>

<style scoped>
.marketplace-navigation {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 12px 8px;
  border-right: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 22%, transparent);
}
.marketplace-nav-group,
.marketplace-nav-categories {
  display: grid;
  gap: 2px;
}
button {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
button:hover {
  background: color-mix(in srgb, var(--muted) 70%, transparent);
  color: var(--foreground);
}
button.active {
  background: var(--accent);
  color: var(--accent-foreground);
  font-weight: 600;
}
button svg {
  width: 15px;
  height: 15px;
}
button em {
  min-width: 20px;
  padding: 1px 5px;
  border-radius: 9px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 10px;
  font-style: normal;
  text-align: center;
}
.marketplace-nav-heading {
  margin: 18px 9px 6px;
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.marketplace-nav-categories {
  overflow: auto;
}
.marketplace-nav-categories button {
  grid-template-columns: 1fr auto;
  min-height: 28px;
}
.marketplace-nav-categories em {
  background: transparent;
}
.marketplace-nav-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 12px 9px 2px;
  border-top: 1px solid var(--border);
  color: var(--muted-foreground);
  font-size: 10px;
}
.marketplace-nav-footer i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--destructive);
}
.marketplace-nav-footer i.online {
  background: var(--success);
}
</style>

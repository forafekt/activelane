<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import MarketplaceAppCard from '../components/MarketplaceAppCard.vue'
import MarketplaceFeaturedApp from '../components/MarketplaceFeaturedApp.vue'
import { useMarketplace } from '../composables/useMarketplaceStore'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const ArrowRight = props.runtime.workbench.ui.getIcon('lucide:arrow-right')
const featured = computed(
  () =>
    marketplace.featuredExtensions.value[0] ??
    marketplace.recommendedExtensions.value[0] ??
    marketplace.extensions.value[0],
)
const popular = computed(() =>
  marketplace.extensions.value
    .slice()
    .sort((a, b) => b.downloads.total - a.downloads.total)
    .slice(0, 4),
)
const productivity = computed(() =>
  marketplace.extensions.value
    .filter((item) => item.categories.includes('productivity'))
    .slice(0, 4),
)
const newItems = computed(() => marketplace.recentlyUpdatedExtensions.value.slice(0, 4))
const collections = computed(() => [
  {
    title: 'Popular this week',
    subtitle: 'Frequently installed across ActiveLane workspaces',
    items: popular.value,
  },
  {
    title: 'Productivity',
    subtitle: 'Tools that keep work moving without leaving the workbench',
    items: productivity.value.length
      ? productivity.value
      : marketplace.recommendedExtensions.value.slice(0, 4),
  },
  {
    title: 'New & noteworthy',
    subtitle: 'Fresh releases and meaningful updates',
    items: newItems.value,
  },
])
</script>

<template>
  <div class="discover-view">
    <div class="discover-intro">
      <div>
        <span>Discover</span>
        <h1>Build a workbench that works your way.</h1>
        <p>
          Applications, integrations and professional tools that become part of ActiveLane—not
          another disconnected browser tab.
        </p>
      </div>
      <div class="discover-stat">
        <strong>{{ marketplace.stats.value.totalExtensions }}</strong><span>apps available</span>
      </div>
    </div>
    <MarketplaceFeaturedApp v-if="featured" :runtime="runtime" :extension="featured" />
    <section
      v-for="collection in collections"
      :key="collection.title"
      class="marketplace-collection"
    >
      <header>
        <div>
          <h2>{{ collection.title }}</h2>
          <p>{{ collection.subtitle }}</p>
        </div>
        <button type="button" @click="marketplace.setPage('browse')">See all <ArrowRight /></button>
      </header>
      <div v-if="collection.items.length" class="collection-grid">
        <MarketplaceAppCard
          v-for="extension in collection.items"
          :key="extension.id"
          :runtime="runtime"
          :extension="extension"
        />
      </div>
      <div v-else class="collection-empty">
        More applications will appear as registries publish them.
      </div>
    </section>
  </div>
</template>

<style scoped>
.discover-view {
  display: grid;
  gap: 26px;
  padding: 26px 30px 44px;
}
.discover-intro {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 30px;
}
.discover-intro > div:first-child {
  max-width: 730px;
}
.discover-intro span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.discover-intro h1 {
  margin: 5px 0 7px;
  font-size: 23px;
  line-height: 1.25;
  letter-spacing: -0.025em;
}
.discover-intro p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.5;
}
.discover-stat {
  display: grid;
  text-align: right;
}
.discover-stat strong {
  font-size: 22px;
}
.discover-stat span {
  letter-spacing: 0;
  text-transform: none;
}
.marketplace-collection {
  display: grid;
  gap: 12px;
}
.marketplace-collection > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
}
.marketplace-collection h2 {
  margin: 0;
  font-size: 14px;
}
.marketplace-collection p {
  margin: 3px 0 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.marketplace-collection button {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 11px;
  cursor: pointer;
}
.marketplace-collection button:hover {
  color: var(--foreground);
}
.marketplace-collection button svg {
  width: 13px;
}
.collection-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.collection-empty {
  padding: 25px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--muted-foreground);
  font-size: 12px;
  text-align: center;
}
@media (max-width: 1280px) {
  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .discover-view {
    padding: 18px;
  }
  .collection-grid {
    grid-template-columns: 1fr;
  }
  .discover-stat {
    display: none;
  }
}
@container (max-width: 1000px) {
  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (max-width: 620px) {
  .discover-view {
    padding: 18px;
  }
  .collection-grid {
    grid-template-columns: 1fr;
  }
  .discover-stat {
    display: none;
  }
}
</style>

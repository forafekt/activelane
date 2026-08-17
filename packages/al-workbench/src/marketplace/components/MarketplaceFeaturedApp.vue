<script setup lang="ts">
import { ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'
import { extensionIcon } from './MarketplaceShared'

const props = defineProps<{ runtime: WorkbenchRuntimeApi; extension: MarketplaceExtension }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [AlBadge, AlButton] = props.runtime.workbench.ui.getComponents(['AlBadge', 'AlButton'])
const ArrowRight = props.runtime.workbench.ui.getIcon('lucide.arrow-right')
const BadgeCheck = props.runtime.workbench.ui.getIcon('lucide.badge-check')
const media = props.extension.gallery.find((item) => item.type === 'image')
const mediaFailed = ref(false)
</script>

<template>
  <article class="marketplace-featured">
    <div class="featured-copy">
      <AlBadge variant="outline">Featured application</AlBadge>
      <div class="featured-heading">
        <div class="featured-icon"><component :is="extensionIcon(extension)" /></div>
        <div>
          <h2>{{ extension.displayName }}</h2>
          <span
            >{{ extension.publisher.displayName }}
            <BadgeCheck v-if="extension.publisher.verified" /></span
          >
        </div>
      </div>
      <p>{{ extension.longDescription || extension.description }}</p>
      <div class="featured-actions">
        <AlButton :trailing-icon="ArrowRight" @click="marketplace.openExtensionDetails(extension)"
          >Explore {{ extension.displayName }}</AlButton
        >
        <span v-if="extension.plans.some((plan) => plan.priceMinor)">Plans available</span
        ><span v-else>Free to install</span>
      </div>
    </div>
    <div class="featured-artwork">
      <img
        v-if="media && !mediaFailed"
        :src="media.source"
        :alt="media.altText || media.description"
        @error="mediaFailed = true"
      >
      <div v-else class="artwork-window">
        <div class="artwork-toolbar"><i /><i /><i /></div>
        <div class="artwork-layout">
          <aside />
          <main><span /><span /><span /></main>
          <section />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.marketplace-featured {
  display: grid;
  min-height: 260px;
  grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
}
.featured-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px;
}
.featured-copy > :deep(.badge) {
  align-self: flex-start;
}
.featured-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 18px;
}
.featured-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--muted);
}
.featured-icon :deep(svg),
.featured-icon :deep(img) {
  width: 26px;
  height: 26px;
}
.featured-heading h2 {
  margin: 0;
  font-size: 25px;
  letter-spacing: -0.03em;
}
.featured-heading span {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  color: var(--muted-foreground);
  font-size: 11px;
}
.featured-heading span svg {
  width: 13px;
  color: var(--info);
}
.featured-copy p {
  max-width: 550px;
  margin: 16px 0 20px;
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.featured-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.featured-actions span {
  color: var(--muted-foreground);
  font-size: 11px;
}
.featured-artwork {
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 28px 28px 28px 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--muted) 18%, transparent),
    color-mix(in srgb, var(--muted) 62%, transparent)
  );
}
.featured-artwork img {
  width: 100%;
  height: 210px;
  border: 1px solid var(--border);
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
  box-shadow: 0 18px 45px rgb(0 0 0 / 0.18);
}
.artwork-window {
  width: 100%;
  height: 205px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--background);
  box-shadow: 0 18px 45px rgb(0 0 0 / 0.18);
}
.artwork-toolbar {
  display: flex;
  gap: 5px;
  height: 24px;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
}
.artwork-toolbar i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
}
.artwork-layout {
  display: grid;
  height: calc(100% - 24px);
  grid-template-columns: 42px 1fr 90px;
}
.artwork-layout aside,
.artwork-layout section {
  background: color-mix(in srgb, var(--muted) 45%, transparent);
}
.artwork-layout aside {
  border-right: 1px solid var(--border);
}
.artwork-layout section {
  border-left: 1px solid var(--border);
}
.artwork-layout main {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 20px;
}
.artwork-layout main span {
  height: 22px;
  border-radius: 4px;
  background: var(--muted);
}
.artwork-layout main span:first-child {
  width: 45%;
  height: 12px;
}
@media (max-width: 1000px) {
  .marketplace-featured {
    grid-template-columns: 1fr;
  }
  .featured-artwork {
    display: none;
  }
}
@container (max-width: 850px) {
  .marketplace-featured {
    grid-template-columns: 1fr;
  }
  .featured-artwork {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { MarketplaceGalleryItem } from '../types/marketplace'

const props = defineProps<{ runtime: WorkbenchRuntimeApi; items: MarketplaceGalleryItem[] }>()
const selected = ref(0)
const failed = ref(new Set<string>())
watch(
  () => props.items,
  () => {
    selected.value = 0
  },
)
const current = computed(() => props.items[selected.value])
</script>

<template>
  <section v-if="current" class="media-gallery" aria-label="Application preview">
    <div class="media-stage">
      <img
        v-if="current.type === 'image' && !failed.has(current.source)"
        :src="current.source"
        :alt="current.altText || current.description"
        @error="failed = new Set([...failed, current.source])"
      >
      <div v-else-if="current.type === 'image'" class="media-unavailable">
        <div class="preview-shell">
          <header><i /><i /><i /><span>{{ current.title }}</span></header>
          <div>
            <aside />
            <main><b /><b /><b /><b /></main>
            <section />
          </div>
        </div>
      </div>
      <video
        v-else
        :src="current.source"
        :aria-label="current.altText || current.description"
        controls
        preload="metadata"
      />
    </div>
    <div class="media-footer">
      <div class="media-caption">
        <strong>{{ current.title }}</strong><span>{{ current.description }}</span>
      </div>
      <div v-if="items.length > 1" class="media-thumbs">
        <button
          v-for="(item, index) in items"
          :key="`${item.source}:${index}`"
          type="button"
          :class="{ active: selected === index }"
          :aria-label="`Show ${item.title}`"
          @click="selected = index"
        >
          <img v-if="item.type === 'image'" :src="item.source" alt=""><span v-else>▶</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.media-gallery {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
}
.media-stage {
  display: grid;
  aspect-ratio: 16 / 8.5;
  place-items: center;
  overflow: hidden;
  background: color-mix(in srgb, var(--muted) 55%, transparent);
}
.media-stage img,
.media-stage video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.media-unavailable {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 25px;
  background: radial-gradient(circle at 70% 20%, var(--muted), transparent 50%);
}
.preview-shell {
  width: min(620px, 90%);
  height: 75%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--background);
  box-shadow: 0 18px 55px rgb(0 0 0 / 0.22);
}
.preview-shell header {
  display: flex;
  height: 25px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
}
.preview-shell header i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
}
.preview-shell header span {
  margin-left: 7px;
  color: var(--muted-foreground);
  font-size: 8px;
}
.preview-shell > div {
  display: grid;
  height: calc(100% - 25px);
  grid-template-columns: 50px 1fr 120px;
}
.preview-shell aside,
.preview-shell section {
  background: color-mix(in srgb, var(--muted) 35%, transparent);
}
.preview-shell aside {
  border-right: 1px solid var(--border);
}
.preview-shell section {
  border-left: 1px solid var(--border);
}
.preview-shell main {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 18px;
}
.preview-shell b {
  display: block;
  height: 22px;
  border-radius: 4px;
  background: var(--muted);
}
.preview-shell b:first-child {
  width: 45%;
  height: 10px;
}
.media-footer {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
}
.media-caption {
  display: grid;
}
.media-caption strong {
  font-size: 11px;
}
.media-caption span {
  margin-top: 2px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.media-thumbs {
  display: flex;
  gap: 5px;
}
.media-thumbs button {
  width: 42px;
  height: 30px;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 4px;
  opacity: 0.62;
  background: var(--muted);
  cursor: pointer;
}
.media-thumbs button.active {
  border-color: var(--ring);
  opacity: 1;
}
.media-thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { extensionIcon, statusLabel, statusTone } from '../components/MarketplaceShared'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const query = ref('')
const [AlBadge, AlButton, AlInput] = props.runtime.workbench.ui.getComponents([
  'AlBadge',
  'AlButton',
  'AlInput',
])
const [CheckCircle2, Search, Settings2, Trash2] = props.runtime.workbench.ui.getIcons([
  'CheckCircle2',
  'Search',
  'Settings2',
  'Trash2',
])
const installed = computed(() =>
  marketplace.installedExtensions.value.filter((item) =>
    `${item.displayName} ${item.publisher.displayName}`
      .toLowerCase()
      .includes(query.value.toLowerCase()),
  ),
)
async function primary(item: MarketplaceExtension) {
  if (item.status === 'disabled') await marketplace.enableExtension(item.id)
  else await marketplace.openExtension(item)
}
</script>

<template>
  <div class="management-view">
    <header>
      <div>
        <span>Library</span>
        <h1>Installed applications</h1>
        <p>Open, configure and maintain software added to this workbench.</p>
      </div>
      <strong>{{ installed.length }}</strong>
    </header>
    <div class="management-search">
      <Search />
      <AlInput
        v-model="query"
        aria-label="Search installed applications"
        placeholder="Search installed"
      />
    </div>
    <section v-if="marketplace.updateAvailableExtensions.value.length" class="attention-section">
      <div class="section-title">
        <div>
          <h2>Updates available</h2>
          <p>
            {{ marketplace.updateAvailableExtensions.value.length }}
            applications have newer releases.
          </p>
        </div>
        <AlButton size="sm" variant="outline" @click="marketplace.setPage('updates')"
          >Review updates</AlButton
        >
      </div>
    </section>
    <div v-if="installed.length" class="installed-list">
      <article v-for="extension in installed" :key="extension.id">
        <div class="installed-icon"><component :is="extensionIcon(extension)" /></div>
        <div class="installed-copy">
          <div>
            <h2>{{ extension.displayName }}</h2>
            <AlBadge :tone="statusTone(extension)">{{ statusLabel(extension) }}</AlBadge
            ><AlBadge v-if="extension.restartRequired" tone="warning">Restart required</AlBadge>
          </div>
          <p>{{ extension.description }}</p>
          <span
            >Version {{ extension.installedVersion || extension.version }} ·
            {{ extension.publisher.displayName }}</span
          >
        </div>
        <div class="installed-actions">
          <AlButton size="sm" @click="primary(extension)"
            >{{ extension.status === 'disabled' ? 'Enable' : 'Open' }}</AlButton
          ><AlButton
            size="sm"
            variant="outline"
            :leading-icon="Settings2"
            @click="marketplace.openExtensionDetails(extension)"
            >Manage</AlButton
          ><AlButton
            size="sm"
            variant="ghost"
            :leading-icon="Trash2"
            aria-label="Uninstall"
            @click="marketplace.uninstallExtension(extension.id)"
          />
        </div>
      </article>
    </div>
    <div v-else class="management-empty">
      <CheckCircle2 />
      <h2>No installed applications</h2>
      <p>Applications you install from Marketplace will be managed here.</p>
      <AlButton variant="outline" @click="marketplace.setPage('discover')"
        >Explore marketplace</AlButton
      >
    </div>
  </div>
</template>

<style scoped>
.management-view {
  padding: 28px 32px 48px;
}
.management-view > header {
  display: flex;
  justify-content: space-between;
  align-items: end;
}
.management-view header span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.management-view h1 {
  margin: 5px 0 3px;
  font-size: 22px;
}
.management-view header p,
.section-title p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.management-view header > strong {
  font-size: 27px;
  color: var(--muted-foreground);
}
.management-search {
  position: relative;
  max-width: 430px;
  margin: 22px 0;
}
.management-search svg {
  position: absolute;
  z-index: 1;
  left: 10px;
  top: 9px;
  width: 14px;
  color: var(--muted-foreground);
}
.management-search :deep(input) {
  height: 32px;
  padding-left: 31px;
}
.attention-section {
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--warning) 5%, transparent);
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title h2 {
  margin: 0 0 3px;
  font-size: 12px;
}
.installed-list {
  border-top: 1px solid var(--border);
}
.installed-list article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 13px;
  align-items: center;
  padding: 14px 4px;
  border-bottom: 1px solid var(--border);
}
.installed-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 8px;
  background: var(--muted);
}
.installed-icon :deep(svg),
.installed-icon :deep(img) {
  width: 21px;
  height: 21px;
}
.installed-copy > div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.installed-copy h2 {
  margin: 0;
  font-size: 13px;
}
.installed-copy p {
  margin: 4px 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.installed-copy > span {
  color: var(--muted-foreground);
  font-size: 10px;
}
.installed-actions {
  display: flex;
  gap: 6px;
}
.management-empty {
  display: grid;
  justify-items: center;
  padding: 90px 20px;
  text-align: center;
}
.management-empty > svg {
  width: 35px;
  color: var(--success);
}
.management-empty h2 {
  margin: 15px 0 4px;
  font-size: 15px;
}
.management-empty p {
  margin: 0 0 16px;
  color: var(--muted-foreground);
  font-size: 12px;
}
</style>

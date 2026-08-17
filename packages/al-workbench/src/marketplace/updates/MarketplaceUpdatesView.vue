<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { extensionIcon, formatDate } from '../components/MarketplaceShared'
import { useMarketplace } from '../composables/useMarketplaceStore'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [AlBadge, AlButton] = props.runtime.workbench.ui.getComponents(['AlBadge', 'AlButton'])
const CheckCircle2 = props.runtime.workbench.ui.getIcon('lucide.circle-check-big')
const RefreshCcw = props.runtime.workbench.ui.getIcon('lucide.refresh-ccw')
</script>

<template>
  <div class="updates-view">
    <header>
      <div>
        <span>Maintenance</span>
        <h1>Application updates</h1>
        <p>Review version changes before applying them to your workbench.</p>
      </div>
      <AlButton
        v-if="marketplace.updateAvailableExtensions.value.length > 1"
        :leading-icon="RefreshCcw"
        disabled
        title="Bulk staging is not supported by this host"
        >Update all</AlButton
      >
    </header>
    <div v-if="marketplace.updateAvailableExtensions.value.length" class="updates-list">
      <article v-for="extension in marketplace.updateAvailableExtensions.value" :key="extension.id">
        <div class="update-icon"><component :is="extensionIcon(extension)" /></div>
        <div class="update-copy">
          <div>
            <h2>{{ extension.displayName }}</h2>
            <AlBadge tone="warning">Update available</AlBadge>
          </div>
          <p class="version">
            {{ extension.installedVersion }} <span>→</span> {{ extension.updateAvailable?.version }}
          </p>
          <p>{{ extension.updateAvailable?.changelog }}</p>
          <span
            >Released
            {{ formatDate(extension.updateAvailable?.releaseDate || extension.lastUpdated) }}</span
          >
        </div>
        <div class="update-actions">
          <AlButton size="sm" variant="ghost" @click="marketplace.openExtensionDetails(extension)"
            >View changelog</AlButton
          ><AlButton
            size="sm"
            :leading-icon="RefreshCcw"
            :loading="Boolean(marketplace.activeOperations.value[extension.id])"
            @click="marketplace.updateExtension(extension.id)"
            >Update</AlButton
          >
        </div>
      </article>
    </div>
    <div v-else class="updates-empty">
      <div><CheckCircle2 /></div>
      <h2>Everything is up to date</h2>
      <p>
        Your installed applications are using the latest releases available from their registries.
      </p>
      <AlButton variant="outline" @click="marketplace.refresh()">Check again</AlButton>
    </div>
  </div>
</template>

<style scoped>
.updates-view {
  padding: 28px 32px 48px;
}
.updates-view > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
}
.updates-view header span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.updates-view h1 {
  margin: 5px 0 3px;
  font-size: 22px;
}
.updates-view header p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.updates-list {
  margin-top: 24px;
  border-top: 1px solid var(--border);
}
.updates-list article {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 17px 4px;
  border-bottom: 1px solid var(--border);
}
.update-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 9px;
  background: var(--muted);
}
.update-icon :deep(svg),
.update-icon :deep(img) {
  width: 22px;
  height: 22px;
}
.update-copy > div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.update-copy h2 {
  margin: 0;
  font-size: 13px;
}
.update-copy p {
  margin: 4px 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.update-copy .version {
  color: var(--foreground);
  font-family: ui-monospace, monospace;
}
.version span {
  margin: 0 5px;
  color: var(--muted-foreground);
}
.update-copy > span {
  color: var(--muted-foreground);
  font-size: 10px;
}
.update-actions {
  display: flex;
  gap: 6px;
}
.updates-empty {
  display: grid;
  justify-items: center;
  padding: 110px 20px;
  text-align: center;
}
.updates-empty > div {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--success) 10%, transparent);
}
.updates-empty svg {
  width: 25px;
  color: var(--success);
}
.updates-empty h2 {
  margin: 16px 0 5px;
  font-size: 15px;
}
.updates-empty p {
  max-width: 420px;
  margin: 0 0 16px;
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.5;
}
</style>

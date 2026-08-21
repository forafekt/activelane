<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'
import { extensionIcon, primaryAction, statusLabel } from './MarketplaceShared'

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  extension: MarketplaceExtension
  compact?: boolean
}>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [Badge, Button] = props.runtime.workbench.ui.getComponents(['Badge', 'Button'])
const BadgeCheck = props.runtime.workbench.ui.getIcon('lucide:badge-check')
const Star = props.runtime.workbench.ui.getIcon('lucide:star')
const Download = props.runtime.workbench.ui.getIcon('lucide:download')

function pricingLabel() {
  const paid = props.extension.plans.filter((plan) => plan.priceMinor > 0)
  if (!paid.length) return 'Free'
  const plan = paid.slice().sort((a, b) => a.priceMinor - b.priceMinor)[0]
  if (!plan) return 'Paid'
  const price = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.priceMinor / 100)
  return `${price}/${plan.interval === 'monthly' ? 'mo' : 'yr'}`
}

async function runAction() {
  const action = primaryAction(props.extension).action
  if (action === 'install') await marketplace.installExtension(props.extension.id)
  else if (action === 'enable') await marketplace.enableExtension(props.extension.id)
  else if (action === 'update') await marketplace.updateExtension(props.extension.id)
  else if (action === 'open') await marketplace.openExtension(props.extension)
  else marketplace.openExtensionDetails(props.extension)
}
</script>

<template>
  <article class="marketplace-app-card" :class="{ compact }">
    <div class="app-card-topline">
      <div class="app-icon"><component :is="extensionIcon(extension)" /></div>
      <div class="app-title">
        <div>
          <button
            type="button"
            class="app-title-button"
            @click.stop="marketplace.openExtensionDetails(extension)"
          >
            {{ extension.displayName }}
          </button>
          <BadgeCheck
            v-if="extension.publisher.verified"
            class="verified"
            aria-label="Verified publisher"
          />
        </div>
        <span>{{ extension.publisher.displayName }}</span>
      </div>
      <Badge v-if="extension.installState === 'installed'" variant="outline"
        >{{ statusLabel(extension) }}</Badge
      >
    </div>
    <p>{{ extension.description }}</p>
    <div class="app-card-meta">
      <span v-if="extension.rating.count"><Star /> {{ extension.rating.average.toFixed(1) }}</span>
      <span v-else><Star /> New</span>
      <span v-if="extension.downloads.total"
        ><Download /> {{ extension.downloads.total.toLocaleString() }}</span
      >
      <span>{{ extension.categories[0] || 'Applications' }}</span>
      <strong>{{ pricingLabel() }}</strong>
    </div>
    <div v-if="!compact" class="app-card-contributions">
      <span
        v-for="kind in Object.keys(extension.contributions).filter((key) => extension.contributions[key as keyof typeof extension.contributions]?.length).slice(0, 3)"
        :key="kind"
        >{{ kind.replace(/([A-Z])/g, ' $1') }}</span
      >
    </div>
    <Button
      size="sm"
      :variant="primaryAction(extension).variant"
      :loading="Boolean(marketplace.activeOperations.value[extension.id])"
      @click.stop="runAction"
      >{{ primaryAction(extension).label }}</Button
    >
  </article>
</template>

<style scoped>
.marketplace-app-card {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--card);
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    transform 0.12s ease;
}
.marketplace-app-card:hover,
.marketplace-app-card:focus-visible {
  border-color: color-mix(in srgb, var(--foreground) 28%, transparent);
  background: color-mix(in srgb, var(--accent) 40%, transparent);
  outline: none;
  transform: translateY(-1px);
}
.app-card-topline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.app-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--muted);
}
.app-icon :deep(svg),
.app-icon :deep(img) {
  width: 21px;
  height: 21px;
  object-fit: contain;
}
.app-title {
  min-width: 0;
  flex: 1;
}
.app-title div {
  display: flex;
  align-items: center;
  gap: 5px;
}
.app-title-button {
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 650;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.app-title span {
  display: block;
  margin-top: 2px;
  color: var(--muted-foreground);
  font-size: 11px;
}
.verified {
  width: 14px;
  color: var(--info);
}
p {
  min-height: 34px;
  margin: 0;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.app-card-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.app-card-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.app-card-meta svg {
  width: 11px;
}
.app-card-meta strong {
  margin-left: auto;
  color: var(--foreground);
  font-size: 11px;
}
.app-card-contributions {
  display: flex;
  gap: 5px;
  overflow: hidden;
}
.app-card-contributions span {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 9px;
  text-transform: capitalize;
  white-space: nowrap;
}
.marketplace-app-card > :deep(button) {
  justify-self: start;
}
.marketplace-app-card.compact {
  grid-template-columns: minmax(0, 1fr) auto;
}
.compact .app-card-topline,
.compact p,
.compact .app-card-meta {
  grid-column: 1;
}
.compact > :deep(button) {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { WorkbenchSubscription } from '../../core/entitlements/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { extensionIcon, formatDate } from '../components/MarketplaceShared'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const records = ref<
  Array<{ extension: MarketplaceExtension; subscription: WorkbenchSubscription }>
>([])
const loading = ref(true)
const [AlBadge, AlButton] = props.runtime.workbench.ui.getComponents(['Badge', 'Button'])
const CreditCard = props.runtime.workbench.ui.getIcon('lucide.credit-card')
const WalletCards = props.runtime.workbench.ui.getIcon('lucide.wallet-cards')

onMounted(async () => {
  const provider = props.runtime.host.capabilities.subscriptions
  if (!provider) {
    loading.value = false
    return
  }
  const values = await Promise.all(
    marketplace.extensions.value
      .filter((item) => item.plans.length)
      .map(async (extension) => ({
        extension,
        subscription: await provider.getSubscription(extension.id),
      })),
  )
  records.value = values.filter(
    (item): item is { extension: MarketplaceExtension; subscription: WorkbenchSubscription } =>
      Boolean(item.subscription),
  )
  loading.value = false
})

function planFor(item: (typeof records.value)[number]) {
  return item.extension.plans.find((plan) => plan.id === item.subscription.planId)
}
function price(item: (typeof records.value)[number]) {
  const plan = planFor(item)
  if (!plan) return 'Plan pricing unavailable'
  return `${new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency }).format(plan.priceMinor / 100)} / ${plan.interval === 'monthly' ? 'month' : 'year'}`
}
</script>

<template>
  <div class="subscriptions-view">
    <header>
      <span>Billing</span>
      <h1>Your subscriptions</h1>
      <p>Plans and entitlements for commercial ActiveLane applications.</p>
    </header>
    <div v-if="loading" class="subscription-skeleton"><i v-for="item in 3" :key="item" /></div>
    <div v-else-if="records.length" class="subscription-list">
      <article v-for="item in records" :key="item.subscription.id">
        <div class="subscription-icon"><component :is="extensionIcon(item.extension)" /></div>
        <div class="subscription-copy">
          <div>
            <h2>
              {{ item.extension.displayName }}
              · {{ planFor(item)?.name || item.subscription.planId }}
            </h2>
            <AlBadge :tone="item.subscription.cancelAtPeriodEnd ? 'warning' : 'success'"
              >{{ item.subscription.cancelAtPeriodEnd ? 'Cancels at period end' : 'Active' }}</AlBadge
            >
          </div>
          <strong>{{ price(item) }}</strong>
          <p>
            {{ item.subscription.cancelAtPeriodEnd ? 'Access ends' : 'Renews' }}
            {{ formatDate(item.subscription.currentPeriodEnd) }}
            ·
            {{ planFor(item)?.features?.length || 0 }}
            included features
          </p>
        </div>
        <div class="subscription-actions">
          <AlButton size="sm" @click="marketplace.openExtensionDetails(item.extension)"
            >Manage plan</AlButton
          ><AlButton
            size="sm"
            variant="outline"
            @click="marketplace.openExtensionDetails(item.extension)"
            >View application</AlButton
          >
        </div>
      </article>
    </div>
    <div v-else class="subscriptions-empty">
      <div><WalletCards /></div>
      <h2>No active subscriptions</h2>
      <p>Applications with paid plans will appear here after you subscribe.</p>
      <AlButton
        :leading-icon="CreditCard"
        variant="outline"
        @click="marketplace.setPage('discover')"
        >Explore applications</AlButton
      >
    </div>
  </div>
</template>

<style scoped>
.subscriptions-view {
  padding: 28px 32px 48px;
}
.subscriptions-view header span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.subscriptions-view h1 {
  margin: 5px 0 3px;
  font-size: 22px;
}
.subscriptions-view header p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
}
.subscription-list {
  margin-top: 24px;
  border-top: 1px solid var(--border);
}
.subscription-list article {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 18px 4px;
  border-bottom: 1px solid var(--border);
}
.subscription-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 9px;
  background: var(--muted);
}
.subscription-icon :deep(svg),
.subscription-icon :deep(img) {
  width: 23px;
  height: 23px;
}
.subscription-copy > div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.subscription-copy h2 {
  margin: 0;
  font-size: 13px;
}
.subscription-copy > strong {
  display: block;
  margin-top: 5px;
  font-size: 12px;
}
.subscription-copy p {
  margin: 3px 0 0;
  color: var(--muted-foreground);
  font-size: 10px;
}
.subscription-actions {
  display: flex;
  gap: 6px;
}
.subscriptions-empty {
  display: grid;
  justify-items: center;
  padding: 105px 20px;
  text-align: center;
}
.subscriptions-empty > div {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border-radius: 12px;
  background: var(--muted);
}
.subscriptions-empty svg {
  width: 24px;
  color: var(--muted-foreground);
}
.subscriptions-empty h2 {
  margin: 16px 0 5px;
  font-size: 15px;
}
.subscriptions-empty p {
  margin: 0 0 16px;
  color: var(--muted-foreground);
  font-size: 12px;
}
.subscription-skeleton {
  display: grid;
  gap: 8px;
  margin-top: 24px;
}
.subscription-skeleton i {
  height: 76px;
  border-radius: 8px;
  background: var(--muted);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.45;
  }
}
</style>

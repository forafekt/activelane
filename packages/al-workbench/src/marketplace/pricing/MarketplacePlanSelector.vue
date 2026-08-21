<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WorkbenchSubscription } from '../../core/entitlements/types'
import type { WorkbenchSubscriptionPlan } from '../../core/extensions/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  extension: MarketplaceExtension
  subscription?: WorkbenchSubscription
}>()
const emit = defineEmits<{ changed: [subscription: WorkbenchSubscription] }>()
const [Badge, Button] = props.runtime.workbench.ui.getComponents(['Badge', 'Button'])
const Check = props.runtime.workbench.ui.getIcon('lucide:check')
const CheckCircle2 = props.runtime.workbench.ui.getIcon('lucide:circle-check-big')
const X = props.runtime.workbench.ui.getIcon('lucide:x')
const marketplace = useMarketplace({ runtime: props.runtime })
const interval = ref<'monthly' | 'yearly'>('monthly')
const selected = ref<WorkbenchSubscriptionPlan>()
const busy = ref(false)
const complete = ref(false)
const availableIntervals = computed(
  () => new Set(props.extension.plans.map((plan) => plan.interval)),
)
const visiblePlans = computed(() =>
  props.extension.plans.filter(
    (plan) => plan.interval === 'none' || plan.interval === interval.value,
  ),
)
function format(plan: WorkbenchSubscriptionPlan) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 2,
  }).format(plan.priceMinor / 100)
}
async function confirm() {
  const provider = props.runtime.host.capabilities.subscriptions
  if (!provider || !selected.value) return
  busy.value = true
  try {
    const result = props.subscription
      ? await provider.changePlan(props.extension.id, selected.value.id)
      : await provider.subscribe(props.extension.id, selected.value.id)
    await props.runtime.entitlements.refresh(props.extension.id)
    complete.value = true
    emit('changed', result)
  } finally {
    busy.value = false
  }
}
async function completeAction() {
  if (props.extension.installState === 'installed') {
    await marketplace.openExtension(props.extension)
  } else {
    await marketplace.installExtension(props.extension.id)
  }
  selected.value = undefined
  complete.value = false
}
</script>

<template>
  <section class="plan-selector">
    <header>
      <div>
        <span>Pricing</span>
        <h2>Choose a plan</h2>
        <p>Compare included features. You can manage or cancel from Marketplace → Subscriptions.</p>
      </div>
      <div
        v-if="availableIntervals.has('monthly') && availableIntervals.has('yearly')"
        class="billing-toggle"
      >
        <button
          type="button"
          :class="{ active: interval === 'monthly' }"
          @click="interval = 'monthly'"
        >
          Monthly
        </button><button
          type="button"
          :class="{ active: interval === 'yearly' }"
          @click="interval = 'yearly'"
        >
          Annual
        </button>
      </div>
    </header>
    <div class="plan-grid">
      <article
        v-for="(plan, index) in visiblePlans"
        :key="plan.id"
        :class="{ current: subscription?.planId === plan.id, recommended: index === 1 && plan.priceMinor > 0 }"
      >
        <div class="plan-heading">
          <h3>{{ plan.name }}</h3>
          <Badge v-if="subscription?.planId === plan.id" tone="success">Current</Badge
          ><Badge v-else-if="index === 1 && plan.priceMinor > 0" tone="info">Recommended</Badge>
        </div>
        <p class="plan-price">
          {{ format(plan) }}
          <span v-if="plan.interval !== 'none'"
            >/ {{ plan.interval === 'monthly' ? 'month' : 'year' }}</span
          >
        </p>
        <p class="plan-description">{{ plan.description || 'Core application features.' }}</p>
        <Badge v-if="plan.trialDays" variant="outline">{{ plan.trialDays }}-day free trial</Badge>
        <ul>
          <li v-for="feature in plan.features" :key="feature"><Check />{{ feature }}</li>
        </ul>
        <Button
          v-if="plan.interval !== 'none' && subscription?.planId !== plan.id"
          :variant="index === 1 ? 'default' : 'outline'"
          @click="selected = plan"
          >{{ subscription ? 'Change to this plan' : 'Choose plan' }}</Button
        ><span v-else-if="plan.interval === 'none'" class="included"
          >Included with installation</span
        >
      </article>
    </div>
    <div
      v-if="selected"
      class="review-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-review-title"
    >
      <div class="review-dialog">
        <button
          class="review-close"
          type="button"
          aria-label="Close subscription review"
          @click="selected = undefined; complete = false"
        >
          <X />
        </button><template v-if="!complete"
          ><span>Review subscription</span>
          <h2 id="subscription-review-title">{{ extension.displayName }} · {{ selected.name }}</h2>
          <p>Confirm the plan and renewal terms before continuing.</p>
          <dl>
            <div>
              <dt>Plan</dt>
              <dd>{{ selected.name }}</dd>
            </div>
            <div>
              <dt>Billing</dt>
              <dd>{{ selected.interval === 'monthly' ? 'Monthly' : 'Annual' }}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                {{ format(selected) }}
                / {{ selected.interval === 'monthly' ? 'month' : 'year' }}
              </dd>
            </div>
            <div v-if="selected.trialDays">
              <dt>Trial</dt>
              <dd>{{ selected.trialDays }} days free</dd>
            </div>
            <div>
              <dt>Renewal</dt>
              <dd>Automatically until canceled</dd>
            </div>
          </dl>
          <div class="review-note">
            Your subscription is managed by the configured ActiveLane billing provider. Cancellation
            remains available from Marketplace → Subscriptions.
          </div>
          <footer>
            <Button variant="ghost" @click="selected = undefined">Cancel</Button
            ><Button :loading="busy" @click="confirm"
              >{{ selected.trialDays ? 'Start free trial' : 'Start subscription' }}</Button
            >
          </footer></template
        ><template v-else
          ><div class="success-icon"><CheckCircle2 /></div>
          <h2 id="subscription-review-title">Subscription active</h2>
          <p>{{ selected.name }} features are now available for {{ extension.displayName }}.</p>
          <footer>
            <Button variant="outline" @click="selected = undefined; complete = false">Close</Button
            ><Button @click="completeAction"
              >{{ extension.installState === 'installed' ? 'Open application' : 'Install application' }}</Button
            >
          </footer></template
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.plan-selector {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--muted) 18%, transparent);
}
.plan-selector > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 15px;
}
.plan-selector header span {
  color: var(--muted-foreground);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.plan-selector h2 {
  margin: 4px 0;
  font-size: 17px;
}
.plan-selector header p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 10px;
}
.billing-toggle {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
}
.billing-toggle button {
  padding: 4px 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 10px;
  cursor: pointer;
}
.billing-toggle button.active {
  background: var(--accent);
  color: var(--foreground);
  font-weight: 600;
}
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
  gap: 8px;
  margin-top: 15px;
}
.plan-grid article {
  display: flex;
  min-height: 245px;
  flex-direction: column;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.plan-grid article.recommended {
  border-color: color-mix(in srgb, var(--info) 55%, transparent);
}
.plan-heading {
  display: flex;
  justify-content: space-between;
  gap: 7px;
}
.plan-heading h3 {
  margin: 0;
  font-size: 12px;
}
.plan-price {
  margin: 13px 0 5px;
  font-size: 20px;
  font-weight: 650;
}
.plan-price span {
  color: var(--muted-foreground);
  font-size: 10px;
  font-weight: 400;
}
.plan-description {
  min-height: 28px;
  margin: 0 0 8px;
  color: var(--muted-foreground);
  font-size: 10px;
  line-height: 1.4;
}
.plan-grid ul {
  display: grid;
  gap: 6px;
  margin: 12px 0 16px;
  padding: 0;
  list-style: none;
}
.plan-grid li {
  display: flex;
  gap: 5px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.plan-grid li svg {
  width: 12px;
  flex: none;
  color: var(--success);
}
.plan-grid article > :deep(button),
.included {
  margin-top: auto;
}
.included {
  color: var(--muted-foreground);
  font-size: 10px;
}
.review-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 0.58);
}
.review-dialog {
  position: relative;
  width: min(470px, 100%);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.4);
}
.review-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
}
.review-close:hover {
  background: var(--muted);
}
.review-close svg {
  width: 14px;
}
.review-dialog > span {
  color: var(--muted-foreground);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.review-dialog h2 {
  margin: 5px 0;
  font-size: 18px;
}
.review-dialog > p {
  margin: 0 0 18px;
  color: var(--muted-foreground);
  font-size: 11px;
}
.review-dialog dl {
  margin: 0;
  border-top: 1px solid var(--border);
}
.review-dialog dl div {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
}
.review-dialog dt {
  color: var(--muted-foreground);
}
.review-dialog dd {
  margin: 0;
  font-weight: 550;
}
.review-note {
  margin-top: 14px;
  padding: 10px;
  border-radius: 6px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 9px;
  line-height: 1.5;
}
.review-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 18px;
}
.success-icon {
  display: grid;
  width: 44px;
  height: 44px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--success) 12%, transparent);
}
.success-icon svg {
  width: 23px;
  color: var(--success);
}
</style>

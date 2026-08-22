<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { WorkbenchSubscription } from '../../core/entitlements/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import { useMarketplace } from '../composables/useMarketplaceStore'
import MarketplaceContributionsGrid from '../details/MarketplaceContributionsGrid.vue'
import MarketplaceMediaGallery from '../details/MarketplaceMediaGallery.vue'
import MarketplacePlanSelector from '../pricing/MarketplacePlanSelector.vue'
import type { MarketplaceExtension } from '../types/marketplace'
import { extensionIcon, formatDate, primaryAction } from './MarketplaceShared'

defineOptions({ name: 'MarketplaceExtensionDetailsView' })
const props = defineProps<{ tab: WorkbenchTab; runtime: WorkbenchRuntimeApi }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const activeTab = ref<'overview' | 'integrations' | 'permissions' | 'releases'>('overview')
const subscription = ref<WorkbenchSubscription>()
const Button = props.runtime.workbench.ui.getComponent('Button')
const ArrowLeft = props.runtime.workbench.ui.getIcon('lucide:arrow-left')
const BadgeCheck = props.runtime.workbench.ui.getIcon('lucide:badge-check')
const Check = props.runtime.workbench.ui.getIcon('lucide:check')
const ExternalLink = props.runtime.workbench.ui.getIcon('lucide:external-link')
const MoreHorizontal = props.runtime.workbench.ui.getIcon('lucide:ellipsis')
const RefreshCcw = props.runtime.workbench.ui.getIcon('lucide:refresh-ccw')
const Settings2 = props.runtime.workbench.ui.getIcon('lucide:settings-2')
const ShieldCheck = props.runtime.workbench.ui.getIcon('lucide:shield-check')
const Star = props.runtime.workbench.ui.getIcon('lucide:star')
const Trash2 = props.runtime.workbench.ui.getIcon('lucide:trash-2')
const extension = computed(() => {
  const id = typeof props.tab.input?.extensionId === 'string' ? props.tab.input.extensionId : ''
  return marketplace.getExtension(id) ?? marketplace.selectedExtension.value
})
watch(
  () => extension.value?.id,
  async (id) => {
    subscription.value = id
      ? await props.runtime.host.capabilities.subscriptions?.getSubscription(id)
      : undefined
  },
  { immediate: true },
)
const featureItems = computed(() => {
  const manifest = extension.value?.manifest
  const highlights =
    manifest && 'marketplace' in manifest ? manifest.marketplace?.highlights : undefined
  return (
    highlights ??
    extension.value?.plans
      .flatMap((plan) => plan.features ?? [])
      .filter((item, index, values) => values.indexOf(item) === index) ??
    []
  )
})
const pricing = computed(() => {
  const plans = extension.value?.plans.filter((plan) => plan.priceMinor > 0) ?? []
  const plan = plans.sort((a, b) => a.priceMinor - b.priceMinor)[0]
  if (!plan) return 'Free'
  return `From ${new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(plan.priceMinor / 100)}/${plan.interval === 'monthly' ? 'mo' : 'yr'}`
})
async function runPrimary(item: MarketplaceExtension) {
  const action = primaryAction(item).action
  if (action === 'install') await marketplace.installExtension(item.id)
  else if (action === 'enable') await marketplace.enableExtension(item.id)
  else if (action === 'update') await marketplace.updateExtension(item.id)
  else if (action === 'open') await marketplace.openExtension(item)
  else activeTab.value = 'overview'
}
function back() {
  marketplace.openMarketplace()
}
</script>

<template>
  <section class="details-app">
    <div v-if="extension" class="details-wrap">
      <button class="details-back" type="button" @click="back">
        <ArrowLeft />
        Marketplace <span>/</span> {{ extension.categories[0] || 'Applications' }}
      </button>
      <header class="product-header">
        <div class="product-identity">
          <div class="product-icon"><component :is="extensionIcon(extension)" /></div>
          <div>
            <div class="product-title">
              <h1>{{ extension.displayName }}</h1>
              <BadgeCheck v-if="extension.publisher.verified" aria-label="Verified publisher" />
            </div>
            <p>{{ extension.publisher.displayName }} · Version {{ extension.version }}</p>
            <span>{{ extension.description }}</span>
          </div>
        </div>
        <div class="product-metrics">
          <div>
            <strong v-if="extension.rating.count"
              ><Star /> {{ extension.rating.average.toFixed(1) }}</strong
            ><strong v-else>New</strong
            ><span
              >{{ extension.rating.count ? `${extension.rating.count} reviews` : 'Not yet rated' }}</span
            >
          </div>
          <div>
            <strong>{{ pricing }}</strong
            ><span
              >{{ extension.pricingModel === 'free' ? 'No purchase required' : 'Commercial application' }}</span
            >
          </div>
          <div>
            <strong>{{ extension.categories[0] || 'Application' }}</strong
            ><span>Updated {{ formatDate(extension.lastUpdated) }}</span>
          </div>
        </div>
        <div class="product-actions">
          <Button
            :variant="primaryAction(extension).variant"
            :loading="Boolean(marketplace.activeOperations.value[extension.id])"
            @click="runPrimary(extension)"
            >{{ primaryAction(extension).label }}</Button
          ><Button
            v-if="extension.settings.length && extension.installState === 'installed'"
            variant="outline"
            :leading-icon="Settings2"
            @click="marketplace.openExtensionSettings(extension)"
            >Configure</Button
          ><Button variant="ghost" :leading-icon="MoreHorizontal" aria-label="More actions" />
        </div>
      </header>
      <div
        v-if="extension.updateAvailable || extension.restartRequired || extension.compatibility === 'incompatible'"
        class="product-notice"
      >
        <RefreshCcw v-if="extension.updateAvailable" />
        <ShieldCheck v-else />
        <div>
          <strong
            >{{ extension.updateAvailable ? `Update ${extension.updateAvailable.version} available` : extension.restartRequired ? 'Restart ActiveLane to finish setup' : 'This release is not compatible' }}</strong
          ><span
            >{{ extension.updateAvailable?.changelog || extension.compatibilityReason || 'The application will become available after restart.' }}</span
          >
        </div>
        <Button
          v-if="extension.updateAvailable"
          size="sm"
          @click="marketplace.updateExtension(extension.id)"
          >Update</Button
        >
      </div>
      <nav class="details-tabs" aria-label="Application details">
        <button
          v-for="item in [{ id: 'overview', label: 'Overview' }, { id: 'integrations', label: 'Adds to ActiveLane' }, { id: 'permissions', label: 'Trust & permissions' }, { id: 'releases', label: 'Releases' }]"
          :key="item.id"
          type="button"
          :class="{ active: activeTab === item.id }"
          @click="activeTab = item.id as typeof activeTab"
        >
          {{ item.label }}
        </button>
      </nav>

      <main v-if="activeTab === 'overview'" class="details-main">
        <div class="details-primary">
          <MarketplaceMediaGallery
            v-if="extension.gallery.length"
            :runtime="runtime"
            :items="extension.gallery"
          />
          <div v-else class="media-fallback">
            <div>
              <component :is="extensionIcon(extension)" />
              <strong>{{ extension.displayName }}</strong
              ><span>Publisher media has not been provided for this release.</span>
            </div>
          </div>
          <section class="editorial-section">
            <span>About this application</span>
            <h2>{{ extension.longDescription }}</h2>
            <p v-for="paragraph in extension.readme" :key="paragraph">{{ paragraph }}</p>
          </section>
          <section v-if="featureItems.length" class="features-section">
            <span>Highlights</span>
            <h2>Built for focused work</h2>
            <div>
              <article v-for="feature in featureItems" :key="feature">
                <Check />
                <p>{{ feature }}</p>
              </article>
            </div>
          </section>
          <MarketplaceContributionsGrid
            :runtime="runtime"
            :contributions="extension.contributions"
          />
          <MarketplacePlanSelector
            v-if="extension.plans.length"
            :runtime="runtime"
            :extension="extension"
            :subscription="subscription"
            @changed="subscription = $event"
          />
        </div>
        <aside class="details-aside">
          <section>
            <h2>About</h2>
            <dl>
              <div>
                <dt>Publisher</dt>
                <dd>{{ extension.publisher.displayName }}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{{ extension.version }}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{{ formatDate(extension.lastUpdated) }}</dd>
              </div>
              <div>
                <dt>Compatibility</dt>
                <dd>{{ extension.compatibility }}</dd>
              </div>
              <div>
                <dt>Package</dt>
                <dd>{{ extension.packageType || 'marketplace' }}</dd>
              </div>
              <div>
                <dt>Registry</dt>
                <dd>{{ extension.registryDisplayName || 'ActiveLane' }}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Trust</h2>
            <p>
              <ShieldCheck />
              {{ extension.publisher.verified ? 'Verified publisher' : 'Publisher not verified' }}
            </p>
            <p><ShieldCheck /> {{ extension.integrityState || 'Validated during installation' }}</p>
          </section>
          <section v-if="extension.homepage || extension.repository">
            <h2>Links</h2>
            <a v-if="extension.homepage" :href="extension.homepage"
              >Documentation <ExternalLink /></a
            ><a v-if="extension.repository" :href="extension.repository"
              >Source repository <ExternalLink /></a
            >
          </section>
          <section v-if="extension.installState === 'installed'">
            <h2>Management</h2>
            <Button
              v-if="extension.status === 'enabled' || extension.status === 'update-available'"
              size="sm"
              variant="outline"
              @click="marketplace.disableExtension(extension.id)"
              >Disable</Button
            ><Button
              v-else-if="extension.status === 'disabled'"
              size="sm"
              @click="marketplace.enableExtension(extension.id)"
              >Enable</Button
            ><Button
              size="sm"
              variant="ghost"
              :leading-icon="Trash2"
              @click="marketplace.uninstallExtension(extension.id)"
              >Uninstall</Button
            >
          </section>
        </aside>
      </main>
      <main v-else-if="activeTab === 'integrations'" class="focused-panel">
        <MarketplaceContributionsGrid :runtime="runtime" :contributions="extension.contributions" />
      </main>
      <main v-else-if="activeTab === 'permissions'" class="focused-panel">
        <header>
          <span>Security review</span>
          <h2>Capabilities and permissions</h2>
          <p>Review what this application can access before installation.</p>
        </header>
        <div class="permission-grid">
          <section>
            <h3>Permissions</h3>
            <article v-for="permission in extension.permissions" :key="permission">
              <ShieldCheck />
              <div>
                <strong>{{ permission }}</strong><span>Declared by the extension manifest</span>
              </div>
            </article>
            <p v-if="!extension.permissions.length">No privileged permissions requested.</p>
          </section>
          <section>
            <h3>Capabilities</h3>
            <article v-for="capability in extension.capabilities" :key="capability">
              <Check />
              <div>
                <strong>{{ capability }}</strong><span>Registered ActiveLane capability</span>
              </div>
            </article>
            <p v-if="!extension.capabilities.length">No host capabilities declared.</p>
          </section>
        </div>
      </main>
      <main v-else class="focused-panel">
        <header>
          <span>Release history</span>
          <h2>What’s new</h2>
          <p>Version notes and compatibility changes from the publisher.</p>
        </header>
        <article v-for="entry in extension.changelog" :key="entry.version" class="release-entry">
          <div>
            <strong>Version {{ entry.version }}</strong><span>{{ formatDate(entry.date) }}</span>
          </div>
          <ul>
            <li v-for="change in entry.changes" :key="change">{{ change }}</li>
          </ul>
        </article>
      </main>
    </div>
    <div v-else class="details-missing">
      <h1>Application unavailable</h1>
      <p>This marketplace item may have been removed or its registry is offline.</p>
      <Button @click="back">Return to Marketplace</Button>
    </div>
  </section>
</template>

<style scoped>
.details-app {
  height: 100%;
  overflow: auto;
  background: var(--background);
  color: var(--foreground);
}
.details-wrap {
  width: min(1500px, 100%);
  margin: 0 auto;
  padding: 20px 30px 60px;
}
.details-back {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 10px;
  cursor: pointer;
}
.details-back:hover {
  color: var(--foreground);
}
.details-back svg {
  width: 13px;
}
.details-back span {
  opacity: 0.5;
}
.product-header {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) auto;
  gap: 20px;
  padding: 21px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--card);
}
.product-identity {
  display: flex;
  gap: 15px;
}
.product-icon {
  display: grid;
  width: 62px;
  height: 62px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--muted);
}
.product-icon :deep(svg),
.product-icon :deep(img) {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.product-title {
  display: flex;
  align-items: center;
  gap: 7px;
}
.product-title h1 {
  margin: 0;
  font-size: 23px;
  letter-spacing: -0.025em;
}
.product-title svg {
  width: 16px;
  color: var(--info);
}
.product-identity p {
  margin: 3px 0 8px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.product-identity > div > span {
  display: block;
  max-width: 700px;
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.5;
}
.product-metrics {
  display: flex;
  grid-column: 1;
  gap: 0;
  padding-top: 15px;
  border-top: 1px solid var(--border);
}
.product-metrics > div {
  display: grid;
  min-width: 145px;
  gap: 2px;
  padding-right: 22px;
  margin-right: 22px;
  border-right: 1px solid var(--border);
}
.product-metrics > div:last-child {
  border: 0;
}
.product-metrics strong {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  text-transform: capitalize;
}
.product-metrics strong svg {
  width: 12px;
}
.product-metrics span {
  color: var(--muted-foreground);
  font-size: 9px;
}
.product-actions {
  display: flex;
  grid-column: 2;
  grid-row: 1 / span 2;
  align-items: start;
  gap: 6px;
}
.product-notice {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
  padding: 10px 13px;
  border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
  border-radius: 7px;
  background: color-mix(in srgb, var(--warning) 5%, transparent);
}
.product-notice > svg {
  width: 15px;
  color: var(--warning);
}
.product-notice div {
  display: grid;
}
.product-notice strong {
  font-size: 10px;
}
.product-notice span {
  margin-top: 2px;
  color: var(--muted-foreground);
  font-size: 9px;
}
.details-tabs {
  display: flex;
  gap: 22px;
  margin-top: 17px;
  border-bottom: 1px solid var(--border);
}
.details-tabs button {
  position: relative;
  padding: 0 1px 10px;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 11px;
  cursor: pointer;
}
.details-tabs button:hover {
  color: var(--foreground);
}
.details-tabs button.active {
  color: var(--foreground);
  font-weight: 600;
}
.details-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--foreground);
  content: "";
}
.details-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 245px;
  gap: 24px;
  padding-top: 20px;
}
.details-primary {
  display: grid;
  min-width: 0;
  gap: 28px;
}
.media-fallback {
  display: grid;
  min-height: 270px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--muted) 30%, transparent);
}
.media-fallback > div {
  display: grid;
  justify-items: center;
}
.media-fallback :deep(svg),
.media-fallback :deep(img) {
  width: 38px;
  height: 38px;
  margin-bottom: 10px;
}
.media-fallback strong {
  font-size: 14px;
}
.media-fallback span {
  margin-top: 5px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.editorial-section > span,
.features-section > span,
.focused-panel > header span {
  color: var(--muted-foreground);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.editorial-section h2 {
  max-width: 780px;
  margin: 5px 0 10px;
  font-size: 18px;
  line-height: 1.35;
}
.editorial-section p {
  max-width: 820px;
  margin: 0 0 9px;
  color: var(--muted-foreground);
  font-size: 11px;
  line-height: 1.65;
}
.features-section h2 {
  margin: 5px 0 12px;
  font-size: 17px;
}
.features-section > div {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}
.features-section article {
  display: flex;
  gap: 7px;
  padding: 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--muted) 45%, transparent);
}
.features-section svg {
  width: 13px;
  flex: none;
  color: var(--success);
}
.features-section p {
  margin: 0;
  font-size: 10px;
}
.details-aside {
  display: grid;
  align-content: start;
  gap: 12px;
}
.details-aside section {
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.details-aside h2 {
  margin: 0 0 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.details-aside dl {
  display: grid;
  gap: 8px;
  margin: 0;
}
.details-aside dl div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 9px;
}
.details-aside dt {
  color: var(--muted-foreground);
}
.details-aside dd {
  margin: 0;
  text-align: right;
  text-transform: capitalize;
}
.details-aside p,
.details-aside a {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 6px 0;
  color: var(--muted-foreground);
  font-size: 9px;
  text-decoration: none;
}
.details-aside p svg,
.details-aside a svg {
  width: 12px;
}
.details-aside a:hover {
  color: var(--foreground);
}
.details-aside section > :deep(button) {
  width: 100%;
  margin-top: 5px;
}
.focused-panel {
  width: min(960px, 100%);
  padding-top: 28px;
}
.focused-panel > header h2 {
  margin: 5px 0 4px;
  font-size: 18px;
}
.focused-panel > header p {
  margin: 0 0 18px;
  color: var(--muted-foreground);
  font-size: 11px;
}
.permission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.permission-grid > section {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.permission-grid h3 {
  margin: 0 0 12px;
  font-size: 12px;
}
.permission-grid article {
  display: flex;
  gap: 8px;
  padding: 9px 0;
  border-top: 1px solid var(--border);
}
.permission-grid article > svg {
  width: 14px;
  flex: none;
  color: var(--success);
}
.permission-grid article div {
  display: grid;
}
.permission-grid strong {
  font-size: 10px;
}
.permission-grid span,
.permission-grid > section > p {
  color: var(--muted-foreground);
  font-size: 9px;
}
.release-entry {
  margin-top: 12px;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.release-entry > div {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}
.release-entry span {
  color: var(--muted-foreground);
  font-size: 9px;
}
.release-entry ul {
  margin: 10px 0 0;
  padding-left: 17px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.details-missing {
  display: grid;
  height: 100%;
  place-content: center;
  justify-items: center;
}
.details-missing h1 {
  font-size: 17px;
}
.details-missing p {
  color: var(--muted-foreground);
  font-size: 11px;
}
@media (max-width: 1000px) {
  .details-main {
    grid-template-columns: 1fr;
  }
  .details-aside {
    grid-template-columns: repeat(2, 1fr);
  }
  .product-header {
    grid-template-columns: 1fr;
  }
  .product-actions {
    grid-column: 1;
    grid-row: auto;
  }
  .product-metrics {
    flex-wrap: wrap;
  }
}
@media (max-width: 700px) {
  .details-wrap {
    padding: 16px;
  }
  .details-aside,
  .permission-grid,
  .features-section > div {
    grid-template-columns: 1fr;
  }
  .product-metrics > div {
    min-width: 110px;
  }
  .details-tabs {
    gap: 12px;
    overflow: auto;
  }
}
</style>

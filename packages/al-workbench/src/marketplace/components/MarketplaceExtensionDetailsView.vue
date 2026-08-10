<script setup lang="ts">
// import {
//   AlBadge,
//   AlButton,
//   AlCard,
//   AlEmptyState,
//   AlKeyValueList,
//   AlSection,
//   AlSectionHeader,
//   AlSeparator,
//   AlStatBlock,
//   AlTabs,
// } from '@activelane/shadcn'
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench-api'
import { computed, ref } from 'vue'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceContributions, MarketplaceExtension } from '../types/marketplace'
import {
  extensionIcon,
  formatCount,
  formatDate,
  primaryAction,
  statusLabel,
  statusTone,
} from './MarketplaceShared'

defineOptions({ name: 'MarketplaceExtensionDetailsView' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const [
  AlBadge,
  AlButton,
  AlCard,
  AlEmptyState,
  AlKeyValueList,
  AlSection,
  AlSectionHeader,
  AlSeparator,
  AlStatBlock,
  AlTabs,
] = props.runtime.workbench.ui.getComponents([
  'AlBadge',
  'AlButton',
  'AlCard',
  'AlEmptyState',
  'AlKeyValueList',
  'AlSection',
  'AlSectionHeader',
  'AlSeparator',
  'AlStatBlock',
  'AlTabs',
])

const [AlertCircle, Check, ExternalLink, Layers3, RefreshCcw, Settings, Star, Trash2] =
  props.runtime.workbench.ui.getIcons([
    'AlertCircle',
    'Check',
    'ExternalLink',
    'Layers3',
    'RefreshCcw',
    'Settings',
    'Star',
    'Trash2',
  ])

const marketplace = useMarketplace({ runtime: props.runtime })
const activeTab = ref(
  String(props.tab.input?.surface ?? 'overview') === 'settings' ? 'settings' : 'overview',
)

const extension = computed(() => {
  const extensionId =
    typeof props.tab.input?.extensionId === 'string' ? props.tab.input.extensionId : null
  return extensionId ? marketplace.getExtension(extensionId) : marketplace.selectedExtension.value
})

const tabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'contributions', label: 'Contributions' },
  { value: 'settings', label: 'Settings' },
  { value: 'changelog', label: 'Changelog' },
  { value: 'health', label: 'Health' },
]

const contributionSections = computed(() => {
  const contributions = extension.value?.contributions
  if (!contributions) return []
  return (Object.keys(contributions) as Array<keyof MarketplaceContributions>)
    .map((key) => ({ key, title: contributionTitle(key), items: contributions[key] ?? [] }))
    .filter((section) => section.items.length)
})

function contributionTitle(key: keyof MarketplaceContributions) {
  const titles: Record<keyof MarketplaceContributions, string> = {
    commands: 'Commands',
    statusBar: 'Status Bar',
    activityRail: 'Activity Bar',
    sidebarViews: 'Sidebar Views',
    tabRenderers: 'Tab Renderers',
    tabSurfaces: 'Tab Surfaces',
    inspectorPanels: 'Inspector Panels',
    settingsPages: 'Settings Pages',
    menus: 'Menus',
    workbenchViews: 'Workbench Views',
    editorBlocks: 'Editor Blocks',
    captureActions: 'Capture Actions',
    aiTools: 'AI Tools',
  }
  return titles[key]
}

async function runPrimary(item: MarketplaceExtension) {
  const action = primaryAction(item).action
  if (action === 'settings') activeTab.value = 'settings'
  if (action === 'install') await marketplace.installExtension(item.id)
  if (action === 'update') await marketplace.updateExtension(item.id)
  if (action === 'enable') await marketplace.enableExtension(item.id)
  if (action === 'disable') await marketplace.disableExtension(item.id)
}
</script>

<template>
  <section class="h-full min-h-0 overflow-auto bg-background">
    <div class="mx-auto grid max-w-6xl gap-5 p-5">
      <AlEmptyState
        v-if="!extension"
        title="No extension selected"
        description="Open an extension from the marketplace list to inspect details, contributions, settings, and lifecycle status."
        :icon="Layers3"
      />

      <template v-else>
        <header class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div class="flex min-w-0 items-start gap-4">
            <div
              class="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-muted"
            >
              <component :is="extensionIcon(extension)" class="size-7" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 text-2xl font-semibold tracking-tight">
                  {{ extension.displayName }}
                </h1>
                <AlBadge :tone="statusTone(extension)" size="md"
                  >{{ statusLabel(extension) }}</AlBadge
                >
                <AlBadge v-if="extension.publisher.official" tone="success">Official</AlBadge>
                <AlBadge v-if="extension.publisher.verified" tone="success"
                  >Verified Publisher</AlBadge
                >
                <AlBadge v-if="extension.packageType === 'alx'" tone="info">Local Package</AlBadge>
              </div>
              <p class="m-0 mt-1 text-sm text-muted-foreground">
                {{ extension.publisher.displayName }}
                · v{{ extension.version }}
                <span v-if="extension.installedVersion">
                  · installed {{ extension.installedVersion }}</span
                >
              </p>
              <p class="m-0 mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {{ extension.longDescription }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-start justify-start gap-2 lg:justify-end py-2">
            <AlButton
              :variant="primaryAction(extension).variant"
              :loading="marketplace.isLoading.value"
              @click="runPrimary(extension)"
            >
              {{ primaryAction(extension).label }}
            </AlButton>
            <AlButton
              v-if="extension.installState === 'installed'"
              variant="outline"
              :leading-icon="Trash2"
              :disabled="marketplace.isLoading.value"
              @click="marketplace.uninstallExtension(extension.id)"
            >
              Uninstall
            </AlButton>
            <AlButton
              v-if="extension.settings.length"
              variant="ghost"
              :leading-icon="Settings"
              @click="activeTab = 'settings'"
            >
              Settings
            </AlButton>
          </div>
        </header>
        <!--
        <div class="grid gap-3 md:grid-cols-4">
          <AlStatBlock label="Rating" :value="extension.rating.average.toFixed(1)" :delta="`${extension.rating.count} reviews`" />
          <AlStatBlock label="Installs" :value="formatCount(extension.downloads.total)" :delta="`${formatCount(extension.downloads.weekly)}/week`" />
          <AlStatBlock label="Updated" :value="formatDate(extension.lastUpdated)" />
          <AlStatBlock label="Contributions" :value="contributionSections.reduce((sum, section) => sum + section.items.length, 0)" />
        </div> -->

        <AlCard
          v-if="extension.updateAvailable"
          class="flex flex-wrap items-center justify-between gap-3 border-warning/40 p-4"
        >
          <div>
            <div class="flex items-center gap-2 text-sm font-semibold">
              <RefreshCcw class="size-4" />
              Update {{ extension.updateAvailable.version }} available
              <AlBadge v-if="extension.updateAvailable.critical" tone="destructive"
                >Critical</AlBadge
              >
            </div>
            <p class="m-0 mt-1 text-sm text-muted-foreground">
              {{ extension.updateAvailable.changelog }}
            </p>
          </div>
          <AlButton :leading-icon="RefreshCcw" @click="marketplace.updateExtension(extension.id)"
            >Apply Update</AlButton
          >
        </AlCard>

        <AlTabs v-model="activeTab" :tabs="tabs">
          <template #overview>
            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div class="grid gap-4">
                <AlSection>
                  <AlSectionHeader title="Overview" />
                  <div class="mt-3 grid gap-3 text-sm leading-relaxed text-muted-foreground">
                    <p v-for="paragraph in extension.readme" :key="paragraph" class="m-0">
                      {{ paragraph }}
                    </p>
                  </div>
                </AlSection>

                <AlSection v-if="extension.gallery.length">
                  <AlSectionHeader
                    title="Preview"
                    description="Catalog media scaffold for screenshots and guided previews."
                  />
                  <div class="mt-3 grid gap-3 md:grid-cols-2">
                    <AlCard v-for="item in extension.gallery" :key="item.title" class="p-4">
                      <h3 class="m-0 text-sm font-semibold">{{ item.title }}</h3>
                      <p class="m-0 mt-1 text-sm text-muted-foreground">{{ item.description }}</p>
                    </AlCard>
                  </div>
                </AlSection>

                <AlSection>
                  <AlSectionHeader title="Capabilities and Permissions" />
                  <div class="mt-3 grid gap-3 md:grid-cols-2">
                    <AlCard class="p-4">
                      <h3 class="m-0 text-sm font-semibold">Capabilities</h3>
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        <AlBadge
                          v-for="capability in extension.capabilities"
                          :key="capability"
                          variant="secondary"
                          >{{ capability }}</AlBadge
                        >
                        <span
                          v-if="!extension.capabilities.length"
                          class="text-sm text-muted-foreground"
                          >No capabilities declared.</span
                        >
                      </div>
                    </AlCard>
                    <AlCard class="p-4">
                      <h3 class="m-0 text-sm font-semibold">Permissions</h3>
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        <AlBadge
                          v-for="permission in extension.permissions"
                          :key="permission"
                          variant="outline"
                          >{{ permission }}</AlBadge
                        >
                        <span
                          v-if="!extension.permissions.length"
                          class="text-sm text-muted-foreground"
                          >No permissions requested.</span
                        >
                      </div>
                    </AlCard>
                  </div>
                </AlSection>

                <AlSection>
                  <AlSectionHeader title="Activation and Compatibility" />
                  <div class="mt-3 grid gap-3 md:grid-cols-3">
                    <AlCard class="p-4">
                      <h3 class="m-0 text-sm font-semibold">Lifecycle</h3>
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        <AlBadge :tone="extension.status === 'error' ? 'destructive' : 'info'">
                          {{ extension.lifecycleState ?? extension.runtime?.status ?? extension.status }}
                        </AlBadge>
                      </div>
                    </AlCard>
                    <AlCard class="p-4">
                      <h3 class="m-0 text-sm font-semibold">Activation Events</h3>
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        <AlBadge
                          v-for="event in extension.activationEvents"
                          :key="event"
                          variant="outline"
                        >
                          {{ event }}
                        </AlBadge>
                        <span
                          v-if="!extension.activationEvents.length"
                          class="text-sm text-muted-foreground"
                        >
                          No activation events declared.
                        </span>
                      </div>
                    </AlCard>
                    <AlCard class="p-4">
                      <h3 class="m-0 text-sm font-semibold">Host Compatibility</h3>
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        <AlBadge
                          v-for="host in extension.hostCompatibility"
                          :key="host"
                          variant="secondary"
                        >
                          {{ host }}
                        </AlBadge>
                        <span
                          v-if="!extension.hostCompatibility.length"
                          class="text-sm text-muted-foreground"
                        >
                          Uses workbench compatibility.
                        </span>
                      </div>
                    </AlCard>
                  </div>
                </AlSection>
              </div>

              <aside class="grid content-start gap-4 py-2">
                <AlCard class="p-4">
                  <h3 class="m-0 text-sm font-semibold">Metadata</h3>
                  <AlKeyValueList
                    class="mt-3"
                    :items="[
                      { key: 'id', label: 'Identifier', value: extension.id },
                      { key: 'publisher', label: 'Publisher', value: extension.publisher.displayName },
                      { key: 'published', label: 'Published', value: formatDate(extension.firstPublished) },
                      { key: 'categories', label: 'Categories', value: extension.categories.join(', ') },
                      { key: 'tags', label: 'Tags', value: extension.tags.join(', ') },
                      { key: 'source', label: 'Source', value: extension.manifest?.builtin ? 'built-in' : 'workbench' },
                    ]"
                  />
                </AlCard>
                <AlCard class="p-4">
                  <h3 class="m-0 text-sm font-semibold">Links</h3>
                  <div class="mt-3 grid gap-2">
                    <AlButton
                      v-if="extension.homepage"
                      variant="outline"
                      size="sm"
                      :leading-icon="ExternalLink"
                      >Homepage</AlButton
                    >
                    <AlButton
                      v-if="extension.repository"
                      variant="outline"
                      size="sm"
                      :leading-icon="ExternalLink"
                      >Repository</AlButton
                    >
                  </div>
                </AlCard>
              </aside>
            </div>
          </template>

          <template #contributions>
            <div class="grid gap-4">
              <AlSectionHeader
                title="Contribution Preview"
                description="Manifest-shaped declarations this extension contributes to the workbench."
              />
              <AlCard v-for="section in contributionSections" :key="section.key" class="p-4">
                <h3 class="m-0 text-sm font-semibold">{{ section.title }}</h3>
                <div class="mt-3 grid gap-2">
                  <div
                    v-for="item in section.items"
                    :key="item.id"
                    class="rounded-md border border-border p-3"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="text-sm font-medium">{{ item.title }}</span>
                      <AlBadge variant="outline">{{ item.id }}</AlBadge>
                    </div>
                    <p
                      v-if="item.description || item.kind"
                      class="m-0 mt-1 text-sm text-muted-foreground"
                    >
                      {{ item.description || item.kind }}
                    </p>
                  </div>
                </div>
              </AlCard>
              <AlEmptyState
                v-if="!contributionSections.length"
                title="No contribution points"
                description="This extension only provides background behavior."
                :icon="Layers3"
              />
            </div>
          </template>

          <template #settings>
            <div class="grid gap-4">
              <AlSectionHeader
                title="Settings Entry Points"
                description="Settings are catalog-backed scaffolds until a host settings service is added."
              />
              <AlCard v-if="extension.settings.length" class="divide-y divide-border">
                <div
                  v-for="setting in extension.settings"
                  :key="setting.key"
                  class="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center"
                >
                  <div>
                    <h3 class="m-0 text-sm font-semibold">{{ setting.title }}</h3>
                    <p class="m-0 mt-1 text-sm text-muted-foreground">{{ setting.description }}</p>
                    <p class="m-0 mt-1 text-xs text-muted-foreground">
                      {{ setting.key }}
                      · {{ setting.type }}
                    </p>
                  </div>
                  <AlBadge variant="outline">Default: {{ setting.defaultValue }}</AlBadge>
                </div>
              </AlCard>
              <AlEmptyState
                v-else
                title="No settings"
                description="This extension does not expose configurable settings."
                :icon="Settings"
              />
            </div>
          </template>

          <template #changelog>
            <div class="grid gap-3">
              <AlCard v-for="entry in extension.changelog" :key="entry.version" class="p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="m-0 text-sm font-semibold">Version {{ entry.version }}</h3>
                  <AlBadge v-if="entry.breaking" tone="warning">Breaking</AlBadge>
                  <span class="text-xs text-muted-foreground">{{ formatDate(entry.date) }}</span>
                </div>
                <ul class="m-0 mt-3 grid gap-1 pl-4 text-sm text-muted-foreground">
                  <li v-for="change in entry.changes" :key="change">{{ change }}</li>
                </ul>
              </AlCard>
            </div>
          </template>

          <template #health>
            <div class="grid gap-4">
              <AlSectionHeader
                title="Status and Runtime Health"
                description="Local install state, runtime activation, warnings, and provider errors."
              />
              <AlCard class="p-4">
                <div class="flex flex-wrap gap-2">
                  <AlBadge :tone="statusTone(extension)" size="md"
                    >{{ statusLabel(extension) }}</AlBadge
                  >
                  <AlBadge variant="outline">Install state: {{ extension.installState }}</AlBadge>
                  <AlBadge v-if="extension.runtime" variant="outline"
                    >Runtime: {{ extension.runtime.status }}</AlBadge
                  >
                </div>
                <AlSeparator class="my-4" />
                <div class="grid gap-3">
                  <div
                    v-for="issue in [...extension.errors, ...extension.warnings]"
                    :key="issue.id"
                    class="rounded-md border border-border p-3"
                  >
                    <div class="flex items-center gap-2">
                      <AlertCircle class="size-4" />
                      <span class="text-sm font-medium">{{ issue.message }}</span>
                      <AlBadge :tone="issue.severity === 'error' ? 'destructive' : 'warning'"
                        >{{ issue.severity }}</AlBadge
                      >
                    </div>
                    <p class="m-0 mt-1 text-xs text-muted-foreground">
                      {{ issue.source }}
                      · {{ formatDate(issue.timestamp) }}
                    </p>
                  </div>
                  <div
                    v-if="!extension.errors.length && !extension.warnings.length && !extension.logs.length"
                    class="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check class="size-4" />
                    No runtime errors or catalog warnings.
                  </div>
                </div>
              </AlCard>
              <AlCard v-if="extension.logs.length" class="divide-y divide-border">
                <div class="p-4">
                  <h3 class="m-0 text-sm font-semibold">Extension Logs</h3>
                  <p class="m-0 mt-1 text-sm text-muted-foreground">
                    Recent structured logs emitted by the extension runtime.
                  </p>
                </div>
                <div
                  v-for="entry in extension.logs.slice(-10)"
                  :key="`${entry.timestamp}-${entry.message}`"
                  class="grid gap-1 p-4"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <AlBadge variant="outline">{{ entry.level }}</AlBadge>
                    <span class="text-xs text-muted-foreground">{{ entry.timestamp }}</span>
                  </div>
                  <p class="m-0 text-sm">{{ entry.message }}</p>
                </div>
              </AlCard>
            </div>
          </template>
        </AlTabs>
      </template>
    </div>
  </section>
</template>

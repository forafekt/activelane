<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { computed } from 'vue'
import { useMarketplace } from '../composables/useMarketplaceStore'
import type { MarketplaceExtension } from '../types/marketplace'
import { extensionIcon, primaryAction, statusLabel, statusTone } from './MarketplaceShared'

defineOptions({ name: 'MarketplaceSidebarView' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
}>()

const [
  AlSearchBar,
  AlBadge,
  AlButton,
  AlSelectableItem,
  AlSidebarSection,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
] = props.runtime.workbench.ui.getComponents([
  'AlSearchBar',
  'AlBadge',
  'AlButton',
  'AlSelectableItem',
  'AlSidebarSection',
  'Collapsible',
  'CollapsibleContent',
  'CollapsibleTrigger',
])

const marketplace = useMarketplace({ runtime: props.runtime })

const filteredExtensions = computed(() => marketplace.extensions.value)

console.log({ filteredExtensions: filteredExtensions.value })

async function runPrimary(extension: MarketplaceExtension) {
  const action = primaryAction(extension).action
  if (action === 'details') marketplace.openExtensionDetails(extension)
  if (action === 'settings') marketplace.openExtensionSettings(extension)
  if (action === 'install') await marketplace.installExtension(extension.id)
  if (action === 'update') await marketplace.updateExtension(extension.id)
  if (action === 'enable') await marketplace.enableExtension(extension.id)
  if (action === 'disable') await marketplace.disableExtension(extension.id)
}

const items = [
  {
    key: 'installed',
    label: 'Installed',
    actions: [],
  },
  {
    key: 'recommended',
    label: 'Recommended',
    actions: [],
  },
]

const installedItem = items[0]
const recommendedItem = items[1]
const hasInstalledOrRecommended = computed(() =>
  Boolean(
    installedItem &&
      recommendedItem &&
      (getIsInstalled(installedItem) || getIsRecommended(recommendedItem)),
  ),
)

function getIsInstalled(item: (typeof items)[number]) {
  return marketplace.extensions.value.some(
    (extension) =>
      extension.runtime && extension.runtime[item.key as keyof typeof extension.runtime] === true,
  )
}

function getIsRecommended(item: (typeof items)[number]) {
  return marketplace.extensions.value.some(
    (extension) => item.key in extension && extension[item.key as keyof typeof extension] === true,
  )
}

function getIsInstalledOrRecommended(item: (typeof items)[number]) {
  return getIsInstalled(item) || getIsRecommended(item)
}
</script>

<template>
  <AlSearchBar class="m-2" />
  <template v-if="hasInstalledOrRecommended">
    <Collapsible v-for="item in items" :key="item.key" :default-open="item.key === 'installed'">
      <CollapsibleTrigger>
        {{ item.label }}
        <template #actions>
          {{ marketplace.extensions.value.length }}
        </template>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <section v-if="getIsInstalledOrRecommended(item)">
          <div>
            <div
              v-if="filteredExtensions.length === 0"
              class="grid place-items-center rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground"
            >
              No extensions match the current filters.
            </div>
            <div v-else class="grid min-h-0 overflow-auto">
              <AlSelectableItem
                v-for="extension in filteredExtensions"
                :key="extension.id"
                dense
                :selected="marketplace.selectedExtension.value?.id === extension.id"
                class="items-start rounded-none"
                @click="marketplace.openExtensionDetails(extension)"
                @dblclick="marketplace.openExtensionDetails(extension, 'persistent')"
              >
                <div
                  class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted"
                >
                  <component :is="extensionIcon(extension)" class="size-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="truncate text-sm font-medium font-semibold"
                      >{{ extension.displayName }}</span
                    >
                    <AlBadge size="sm" :tone="statusTone(extension)" class="shrink-0"
                      >{{ statusLabel(extension) }}
                    </AlBadge>
                  </div>
                  <p class="m-0 truncate text-xs">
                    <a :href="`/${extension.publisher.name}`" class="font-semibold hover:underline"
                      >{{ extension.publisher.displayName }}</a
                    >
                    <span class="text-muted-foreground italic">· v{{ extension.version }}</span>
                    <span class="text-muted-foreground"
                      >·
                      {{ extension.pricingModel === 'free' ? 'Free' :
                    extension.pricingModel }}</span
                    >
                  </p>
                  <p class="m-0 mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {{ extension.description }}
                  </p>
                </div>
                <AlButton
                  size="sm"
                  :variant="primaryAction(extension).variant"
                  :disabled="marketplace.isLoading.value"
                  @click.stop="runPrimary(extension)"
                >
                  {{ primaryAction(extension).label }}
                </AlButton>
              </AlSelectableItem>
            </div>
          </div>
        </section>
      </CollapsibleContent>
    </Collapsible>
  </template>
  <section
    v-if="!hasInstalledOrRecommended"
    class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-3 p-3"
  >
    <AlSidebarSection label="" class="min-h-0 overflow-hidden">
      <div
        v-if="filteredExtensions.length === 0"
        class="grid place-items-center rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground"
      >
        No extensions match the current filters.
      </div>
      <div v-else class="grid min-h-0 gap-1 overflow-auto pr-1">
        <AlSelectableItem
          v-for="extension in filteredExtensions"
          :key="extension.id"
          dense
          :selected="marketplace.selectedExtension.value?.id === extension.id"
          class="items-start"
          @click="marketplace.openExtensionDetails(extension)"
          @dblclick="marketplace.openExtensionDetails(extension, 'persistent')"
        >
          <div
            class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted"
          >
            <component :is="extensionIcon(extension)" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-sm font-medium font-semibold"
                >{{ extension.displayName }}</span
              >
              <AlBadge size="sm" :tone="statusTone(extension)" class="shrink-0"
                >{{ statusLabel(extension) }}</AlBadge
              >
            </div>
            <p class="m-0 truncate text-xs">
              <a :href="`/${extension.publisher.name}`" class="font-semibold hover:underline"
                >{{ extension.publisher.displayName }}</a
              >
              <span class="text-muted-foreground italic">· v{{ extension.version }}</span>
              <span class="text-muted-foreground"
                >·
                {{ extension.pricingModel === 'free' ? 'Free' :
                extension.pricingModel }}</span
              >
            </p>
            <p class="m-0 mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {{ extension.description }}
            </p>
          </div>
          <AlButton
            size="sm"
            :variant="primaryAction(extension).variant"
            :disabled="marketplace.isLoading.value"
            @click.stop="runPrimary(extension)"
          >
            {{ primaryAction(extension).label }}
          </AlButton>
        </AlSelectableItem>
      </div>
    </AlSidebarSection>
  </section>
</template>

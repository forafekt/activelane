<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'

import { useMarketplace } from '../composables/useMarketplaceStore'
import { formatDate, statusLabel, statusTone } from './MarketplaceShared'

defineOptions({ name: 'MarketplaceInspectorPanel' })

const props = defineProps<{
  tab: WorkbenchTab | null
  runtime: WorkbenchRuntimeApi
}>()

const [AlBadge, AlButton, AlCard, AlKeyValueList, AlSection, AlSectionHeader, AlStatBlock] =
  props.runtime.workbench.ui.getComponents([
    'AlBadge',
    'AlButton',
    'AlCard',
    'AlKeyValueList',
    'AlSection',
    'AlSectionHeader',
    'AlStatBlock',
  ])

const AlertCircle = props.runtime.workbench.ui.getIcon('lucide.circle-alert')
const Layers3 = props.runtime.workbench.ui.getIcon('lucide.layers-3')
const RefreshCcw = props.runtime.workbench.ui.getIcon('lucide.refresh-ccw')
const Sparkles = props.runtime.workbench.ui.getIcon('lucide.sparkles')

const marketplace = useMarketplace({ runtime: props.runtime })

const selected = computed(() => {
  const extensionId =
    typeof props.tab?.input?.extensionId === 'string' ? props.tab.input.extensionId : null
  return extensionId ? marketplace.getExtension(extensionId) : marketplace.selectedExtension.value
})

const problemExtensions = computed(() =>
  marketplace.extensions.value
    .filter((extension) => extension.status === 'error' || extension.updateAvailable)
    .slice(0, 5),
)
</script>

<template>
  <section class="grid gap-4 p-3">
    <AlCard class="p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Sparkles class="size-4" />
          <h3 class="m-0 truncate text-sm font-semibold">Extension Runtime</h3>
        </div>
        <AlButton
          size="sm"
          variant="ghost"
          :loading="marketplace.isLoading.value"
          @click="marketplace.refresh()"
        >
          <RefreshCcw class="size-4" />
        </AlButton>
      </div>
    </AlCard>

    <div class="grid grid-cols-2 gap-2">
      <AlStatBlock label="Installed" :value="marketplace.stats.value.installedExtensions" />
      <AlStatBlock label="Enabled" :value="marketplace.stats.value.enabledExtensions" />
      <AlStatBlock label="Updates" :value="marketplace.stats.value.updateAvailableExtensions" />
      <AlStatBlock label="Errors" :value="marketplace.stats.value.errorExtensions" />
    </div>

    <AlSection v-if="selected">
      <AlSectionHeader title="Selected Extension" />
      <AlCard class="mt-2 grid gap-3 p-3">
        <div class="flex items-start gap-3">
          <div class="grid size-8 place-items-center rounded-md border border-border bg-muted">
            <Layers3 class="size-4" />
          </div>
          <div class="min-w-0">
            <h4 class="m-0 truncate text-sm font-semibold">{{ selected.displayName }}</h4>
            <p class="m-0 mt-0.5 text-xs text-muted-foreground">
              {{ selected.publisher.displayName }}
              · v{{ selected.version }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <AlBadge :tone="statusTone(selected)">{{ statusLabel(selected) }}</AlBadge>
          <AlBadge v-if="selected.updateAvailable" tone="warning"
            >Update {{ selected.updateAvailable.version }}</AlBadge
          >
          <AlBadge v-if="selected.errors.length" tone="destructive"
            >{{ selected.errors.length }}
            errors</AlBadge
          >
        </div>
        <AlButton size="sm" variant="outline" @click="marketplace.openExtensionDetails(selected)"
          >Open Details</AlButton
        >
      </AlCard>
    </AlSection>

    <AlSection>
      <AlSectionHeader title="Attention" />
      <div v-if="problemExtensions.length" class="mt-2 grid gap-2">
        <button
          v-for="extension in problemExtensions"
          :key="extension.id"
          type="button"
          class="rounded-md border border-border p-3 text-left hover:bg-muted"
          @click="marketplace.openExtensionDetails(extension)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-sm font-medium">{{ extension.displayName }}</span>
            <AlBadge :tone="extension.status === 'error' ? 'destructive' : 'warning'">
              {{ extension.status === 'error' ? 'Error' : 'Update' }}
            </AlBadge>
          </div>
          <p class="m-0 mt-1 text-xs text-muted-foreground">
            {{ extension.errors[0]?.message || extension.updateAvailable?.changelog }}
          </p>
        </button>
      </div>
      <div
        v-else
        class="mt-2 flex items-center gap-2 rounded-md border border-border p-3 text-sm text-muted-foreground"
      >
        <Sparkles class="size-4" />
        No extension issues.
      </div>
    </AlSection>

    <AlSection>
      <AlSectionHeader title="Runtime Records" />
      <AlKeyValueList
        class="mt-2"
        :items="[
          { key: 'discovered', label: 'Discovered', value: runtime.extensions.discovered.length },
          { key: 'records', label: 'Records', value: runtime.extensions.records.length },
          { key: 'active', label: 'Active', value: runtime.extensions.records.filter((item) => item.active).length },
          { key: 'errors', label: 'Errors', value: runtime.extensions.records.filter((item) => item.status === 'error').length },
          { key: 'synced', label: 'Last Sync', value: formatDate(new Date().toISOString()) },
        ]"
      />
    </AlSection>

    <AlSection v-if="marketplace.error.value">
      <AlCard class="flex gap-3 p-3">
        <AlertCircle class="size-4 text-destructive" />
        <p class="m-0 text-sm text-muted-foreground">{{ marketplace.error.value }}</p>
      </AlCard>
    </AlSection>
  </section>
</template>

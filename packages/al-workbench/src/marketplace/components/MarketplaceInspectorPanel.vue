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

const [Badge, Button, Card, KeyValueList, Section, SectionHeader, StatBlock] =
  props.runtime.workbench.ui.getComponents([
    'Badge',
    'Button',
    'Card',
    'KeyValueList',
    'Section',
    'SectionHeader',
    'StatBlock',
  ])

const AlertCircle = props.runtime.workbench.ui.getIcon('lucide:circle-alert')
const Layers3 = props.runtime.workbench.ui.getIcon('lucide:layers-3')
const RefreshCcw = props.runtime.workbench.ui.getIcon('lucide:refresh-ccw')
const Sparkles = props.runtime.workbench.ui.getIcon('lucide:sparkles')

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
    <Card class="p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Sparkles class="size-4" />
          <h3 class="m-0 truncate text-sm font-semibold">Extension Runtime</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          :loading="marketplace.isLoading.value"
          @click="marketplace.refresh()"
        >
          <RefreshCcw class="size-4" />
        </Button>
      </div>
    </Card>

    <div class="grid grid-cols-2 gap-2">
      <StatBlock label="Installed" :value="marketplace.stats.value.installedExtensions" />
      <StatBlock label="Enabled" :value="marketplace.stats.value.enabledExtensions" />
      <StatBlock label="Updates" :value="marketplace.stats.value.updateAvailableExtensions" />
      <StatBlock label="Errors" :value="marketplace.stats.value.errorExtensions" />
    </div>

    <Section v-if="selected">
      <SectionHeader title="Selected Extension" />
      <Card class="mt-2 grid gap-3 p-3">
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
          <Badge :tone="statusTone(selected)">{{ statusLabel(selected) }}</Badge>
          <Badge v-if="selected.updateAvailable" tone="warning"
            >Update {{ selected.updateAvailable.version }}</Badge
          >
          <Badge v-if="selected.errors.length" tone="destructive"
            >{{ selected.errors.length }}
            errors</Badge
          >
        </div>
        <Button size="sm" variant="outline" @click="marketplace.openExtensionDetails(selected)"
          >Open Details</Button
        >
      </Card>
    </Section>

    <Section>
      <SectionHeader title="Attention" />
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
            <Badge :tone="extension.status === 'error' ? 'destructive' : 'warning'">
              {{ extension.status === 'error' ? 'Error' : 'Update' }}
            </Badge>
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
    </Section>

    <Section>
      <SectionHeader title="Runtime Records" />
      <KeyValueList
        class="mt-2"
        :items="[
          { key: 'discovered', label: 'Discovered', value: runtime.extensions.discovered.length },
          { key: 'records', label: 'Records', value: runtime.extensions.records.length },
          { key: 'active', label: 'Active', value: runtime.extensions.records.filter((item) => item.active).length },
          { key: 'errors', label: 'Errors', value: runtime.extensions.records.filter((item) => item.status === 'error').length },
          { key: 'synced', label: 'Last Sync', value: formatDate(new Date().toISOString()) },
        ]"
      />
    </Section>

    <Section v-if="marketplace.error.value">
      <Card class="flex gap-3 p-3">
        <AlertCircle class="size-4 text-destructive" />
        <p class="m-0 text-sm text-muted-foreground">{{ marketplace.error.value }}</p>
      </Card>
    </Section>
  </section>
</template>

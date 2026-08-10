<script setup lang="ts">
import { computed } from 'vue'
import type { ExplorerNode, ExplorerProvider } from '../../core/explorer/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'

import WorkbenchExplorerNode from './WorkbenchExplorerNode.vue'

defineOptions({ name: 'WorkbenchExplorerView' })
const MAX_PROVIDER_ROOTS = 500

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
}>()

const ChevronRight = props.runtime.workbench.ui.getIcon('ChevronRight')
const RefreshCw = props.runtime.workbench.ui.getIcon('RefreshCw')
const FoldVertical = props.runtime.workbench.ui.getIcon('FoldVertical')
const AlertTriangle = props.runtime.workbench.ui.getIcon('AlertTriangle')

const providers = computed(() => props.runtime.explorer.state.providers)
const providerRootRows = computed<Record<string, ExplorerNode[]>>(() => {
  const rows: Record<string, ExplorerNode[]> = {}
  for (const provider of props.runtime.explorer.state.providers) {
    const children = props.runtime.explorer.getChildren(provider.id)
    if (children) rows[provider.id] = children.slice(0, MAX_PROVIDER_ROOTS)
  }
  return rows
})
const providerHiddenCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const provider of props.runtime.explorer.state.providers) {
    const children = props.runtime.explorer.getChildren(provider.id)
    counts[provider.id] =
      children && children.length > MAX_PROVIDER_ROOTS ? children.length - MAX_PROVIDER_ROOTS : 0
  }
  return counts
})

function providerIcon(provider: ExplorerProvider) {
  return props.runtime.workbench.ui.getIcon(provider.icon ?? 'FolderTree')
}

function providerExpanded(provider: ExplorerProvider) {
  return props.runtime.explorer.state.providerState[provider.id]?.expanded ?? true
}

function setProviderExpanded(provider: ExplorerProvider, expanded: boolean) {
  props.runtime.explorer.setProviderExpanded(provider.id, expanded)
}

function providerChildren(provider: ExplorerProvider) {
  return props.runtime.explorer.getChildren(provider.id)
}
</script>

<template>
  <section class="workbench-explorer">
    <div v-if="!providers.length" class="workbench-explorer__empty">No explorer providers</div>

    <article v-for="provider in providers" :key="provider.id" class="explorer-provider">
      <header class="explorer-provider__header">
        <button
          type="button"
          class="explorer-provider__title"
          @click="setProviderExpanded(provider, !providerExpanded(provider))"
        >
          <ChevronRight
            class="explorer-provider__chevron"
            :class="{ 'explorer-provider__chevron--open': providerExpanded(provider) }"
          />
          <component :is="providerIcon(provider)" class="explorer-provider__icon" />
          <span>{{ provider.title }}</span>
        </button>
        <div class="explorer-provider__actions">
          <AlIconButton
            label="Refresh"
            :icon="RefreshCw"
            variant="ghost"
            size="icon-xs"
            @click="runtime.explorer.refresh(provider.id)"
          />
          <AlIconButton
            label="Collapse all"
            :icon="FoldVertical"
            variant="ghost"
            size="icon-xs"
            @click="runtime.explorer.collapseAll(provider.id)"
          />
        </div>
      </header>

      <div v-if="providerExpanded(provider)" class="explorer-provider__body">
        <p
          v-if="runtime.explorer.state.providerState[provider.id]?.error"
          class="explorer-provider__error"
        >
          <AlertTriangle />
          <span>{{ runtime.explorer.state.providerState[provider.id]?.error }}</span>
        </p>
        <p
          v-else-if="runtime.explorer.state.providerState[provider.id]?.loading"
          class="explorer-provider__status"
        >
          Loading
        </p>
        <p v-else-if="providerChildren(provider)?.length === 0" class="explorer-provider__status">
          Empty
        </p>
        <ul v-else class="explorer-provider__tree">
          <WorkbenchExplorerNode
            v-for="node in providerRootRows[provider.id] ?? []"
            :key="node.id"
            :runtime="runtime"
            :node="node"
            :depth="0"
          />
          <li v-if="providerHiddenCounts[provider.id]" class="explorer-provider__overflow">
            {{ providerHiddenCounts[provider.id] }}
            more entries hidden
          </li>
        </ul>
      </div>
    </article>
  </section>
</template>

<style scoped>
.workbench-explorer {
  display: flex;
  min-height: 100%;
  min-width: 0;
  flex-direction: column;
  background: var(--panel);
  color: var(--text-primary);
}

.workbench-explorer__empty,
.explorer-provider__status {
  padding: 0.75rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.explorer-provider {
  min-width: 0;
  border-bottom: 1px solid var(--border);
}

.explorer-provider__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.35rem;
}

.explorer-provider__title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0;
  text-align: left;
  text-transform: uppercase;
}

.explorer-provider__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-provider__chevron,
.explorer-provider__icon {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--text-muted);
}

.explorer-provider__chevron--open {
  transform: rotate(90deg);
}

.explorer-provider__actions {
  display: flex;
  align-items: center;
  opacity: 0;
}

.explorer-provider__header:hover .explorer-provider__actions,
.explorer-provider__actions:focus-within {
  opacity: 1;
}

.explorer-provider__body {
  min-width: 0;
  padding: 0 0.25rem 0.35rem;
}

.explorer-provider__tree {
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.explorer-provider__error {
  display: flex;
  gap: 0.45rem;
  margin: 0.55rem 0.5rem;
  color: var(--danger);
  font-size: 0.75rem;
}

.explorer-provider__error svg {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
}

.explorer-provider__overflow {
  height: 1.55rem;
  padding-left: 2rem;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.55rem;
}
</style>

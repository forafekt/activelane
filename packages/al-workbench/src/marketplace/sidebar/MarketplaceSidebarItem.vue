<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { extensionIcon } from '../components/MarketplaceShared'
import type { MarketplaceExtension } from '../types/marketplace'

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  extension: MarketplaceExtension
  selected?: boolean
  mode: 'installed' | 'update' | 'recommended' | 'search'
}>()
const emit = defineEmits<{
  select: []
  action: [action: 'install' | 'open' | 'update' | 'enable' | 'subscribe']
  manage: [action: string]
}>()
const [AlButton, AlDropdownMenu] = props.runtime.workbench.ui.getComponents([
  'AlButton',
  'AlDropdownMenu',
])
const [BadgeCheck, MoreHorizontal] = props.runtime.workbench.ui.getIcons([
  'BadgeCheck',
  'MoreHorizontal',
])

function priceLabel() {
  const paid = props.extension.plans
    .filter((plan) => plan.priceMinor > 0)
    .sort((left, right) => left.priceMinor - right.priceMinor)[0]
  if (!paid) return 'Free'
  const value = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: paid.currency,
    maximumFractionDigits: 0,
  }).format(paid.priceMinor / 100)
  return `${value}/${paid.interval === 'monthly' ? 'mo' : 'yr'}`
}

function primaryAction() {
  if (props.mode === 'update') return { label: 'Update', action: 'update' as const }
  if (props.extension.status === 'disabled') return { label: 'Enable', action: 'enable' as const }
  if (props.extension.installState === 'installed')
    return { label: 'Open', action: 'open' as const }
  if (props.extension.pricingModel !== 'free')
    return { label: 'View', action: 'subscribe' as const }
  return { label: 'Install', action: 'install' as const }
}

const manageItems = [
  { id: 'open', label: 'Open' },
  { id: 'manage', label: 'View details' },
  { id: 'separator', label: '' },
  { id: 'enable', label: 'Enable' },
  { id: 'disable', label: 'Disable' },
  { id: 'update', label: 'Update' },
  { id: 'separator', label: '' },
  { id: 'uninstall', label: 'Uninstall', destructive: true },
]
</script>

<template>
  <article class="sidebar-item" :class="{ selected }">
    <button type="button" class="sidebar-item-main" @click="emit('select')">
      <span class="sidebar-item-icon"><component :is="extensionIcon(extension)" /></span>
      <span class="sidebar-item-copy">
        <span class="sidebar-item-title">{{ extension.displayName }}</span>
        <span class="sidebar-item-description">{{ extension.description }}</span>
        <span class="sidebar-item-meta">
          <BadgeCheck v-if="extension.publisher.verified" aria-label="Verified publisher" />
          <span>{{ extension.publisher.displayName }}</span>
          <span class="sidebar-item-state">
            <template v-if="mode === 'update'">
              {{ extension.installedVersion }}
              → {{ extension.updateAvailable?.version }}
            </template>
            <template v-else-if="extension.status === 'disabled'">Disabled</template>
            <template v-else-if="extension.installState === 'installed'">Enabled</template>
            <template v-else>{{ priceLabel() }}</template>
          </span>
        </span>
      </span>
    </button>

    <AlDropdownMenu
      v-if="mode === 'installed'"
      :items="manageItems"
      class="w-44"
      @select="emit('manage', $event)"
    >
      <template #trigger>
        <button
          type="button"
          class="sidebar-item-more"
          :aria-label="`Manage ${extension.displayName}`"
        >
          <MoreHorizontal />
        </button>
      </template>
    </AlDropdownMenu>
    <AlButton
      v-else
      class="sidebar-item-action"
      size="sm"
      :variant="mode === 'update' ? 'default' : 'outline'"
      @click="emit('action', primaryAction().action)"
    >
      {{ primaryAction().label }}
    </AlButton>
  </article>
</template>

<style scoped>
.sidebar-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  min-height: 66px;
  border-left: 2px solid transparent;
}
.sidebar-item:hover {
  background: var(--hover);
}
.sidebar-item.selected {
  border-left-color: var(--focus-ring);
  background: var(--selected);
}
.sidebar-item-main {
  display: grid;
  min-width: 0;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  padding: 7px 4px 7px 7px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.sidebar-item-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: var(--pane-inset);
}
.sidebar-item-icon :deep(svg),
.sidebar-item-icon :deep(img) {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.sidebar-item-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}
.sidebar-item-title {
  overflow: hidden;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-item-description {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-item-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 8px;
}
.sidebar-item-meta > svg {
  width: 10px;
  flex: none;
  color: var(--info);
}
.sidebar-item-meta > span:not(.sidebar-item-state) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-item-state {
  margin-left: auto;
  color: var(--foreground);
  white-space: nowrap;
}
.sidebar-item-more {
  display: grid;
  width: 25px;
  height: 25px;
  margin: 5px 3px 0 0;
  place-items: center;
  border: 0;
  border-radius: 4px;
  opacity: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.sidebar-item:hover .sidebar-item-more,
.sidebar-item-more:focus-visible {
  opacity: 1;
}
.sidebar-item-more:hover {
  background: var(--hover);
  color: var(--foreground);
}
.sidebar-item-more svg {
  width: 13px;
}
.sidebar-item-action {
  height: 23px;
  margin: 7px 4px 0 0;
  padding-inline: 7px;
  font-size: 9px;
}
@container (max-width: 285px) {
  .sidebar-item {
    min-height: 60px;
  }
  .sidebar-item-description {
    display: none;
  }
  .sidebar-item-main {
    grid-template-columns: 28px minmax(0, 1fr);
  }
  .sidebar-item-icon {
    width: 26px;
    height: 26px;
  }
}
</style>

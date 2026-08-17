<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { useMarketplace } from '../composables/useMarketplaceStore'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const emit = defineEmits<{ search: [] }>()
const marketplace = useMarketplace({ runtime: props.runtime })
const [AlButton, AlInput] = props.runtime.workbench.ui.getComponents(['AlButton', 'AlInput'])
const [RefreshCcw, Search, WalletCards] = props.runtime.workbench.ui.getIcons([
  'RefreshCcw',
  'Search',
  'WalletCards',
])
</script>

<template>
  <header class="marketplace-header">
    <div class="marketplace-brand">
      <span class="marketplace-brand-mark">AL</span>
      <div>
        <strong>Marketplace</strong>
        <span>Apps for your workbench</span>
      </div>
    </div>
    <div class="marketplace-search">
      <Search aria-hidden="true" />
      <AlInput
        v-model="marketplace.searchQuery.value"
        aria-label="Search marketplace"
        placeholder="Search apps, integrations and publishers"
        @focus="emit('search')"
        @keydown.enter="emit('search')"
      />
      <kbd>⌘ K</kbd>
    </div>
    <div class="marketplace-header-actions">
      <AlButton
        variant="ghost"
        size="sm"
        :leading-icon="WalletCards"
        @click="marketplace.setPage('subscriptions')"
      >
        Subscriptions
      </AlButton>
      <AlButton
        variant="ghost"
        size="sm"
        :leading-icon="RefreshCcw"
        :loading="marketplace.isLoading.value"
        aria-label="Refresh marketplace"
        @click="marketplace.refresh()"
      />
    </div>
  </header>
</template>

<style scoped>
.marketplace-header {
  height: 58px;
  display: grid;
  grid-template-columns: 220px minmax(280px, 640px) 1fr;
  align-items: center;
  gap: 22px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--background);
}
.marketplace-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.marketplace-brand-mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: var(--foreground);
  color: var(--background);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.marketplace-brand div {
  display: grid;
  line-height: 1.2;
}
.marketplace-brand strong {
  font-size: 14px;
}
.marketplace-brand span:last-child {
  color: var(--muted-foreground);
  font-size: 11px;
}
.marketplace-search {
  position: relative;
}
.marketplace-search > svg {
  position: absolute;
  z-index: 1;
  left: 11px;
  top: 50%;
  width: 15px;
  transform: translateY(-50%);
  color: var(--muted-foreground);
}
.marketplace-search :deep(input) {
  height: 34px;
  padding-left: 34px;
  padding-right: 48px;
  background: color-mix(in srgb, var(--muted) 55%, transparent);
  border-color: transparent;
}
.marketplace-search :deep(input:focus) {
  border-color: var(--ring);
  background: var(--background);
}
.marketplace-search kbd {
  position: absolute;
  right: 8px;
  top: 7px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.marketplace-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
@media (max-width: 900px) {
  .marketplace-header {
    grid-template-columns: auto 1fr;
  }
  .marketplace-brand div,
  .marketplace-header-actions {
    display: none;
  }
}
@container (max-width: 820px) {
  .marketplace-header {
    grid-template-columns: auto 1fr;
    gap: 10px;
  }
  .marketplace-brand div,
  .marketplace-header-actions {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { AlScrollArea, AlSearchBar, AlTabs } from '@activelane/shadcn'
import PaneHeader from './PaneHeader.vue'
import PaneToolbar from './PaneToolbar.vue'

defineOptions({ name: 'ResourceListPane' })

withDefaults(
  defineProps<{
    title?: string
    description?: string
    search?: string
    searchPlaceholder?: string
    tabs?: Array<{ value: string; label: string; disabled?: boolean }>
    activeTab?: string
  }>(),
  { searchPlaceholder: 'Search resources' },
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:activeTab': [value: string]
}>()
</script>

<template>
  <div
    class="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] bg-background text-foreground"
  >
    <PaneHeader
      v-if="title || description || $slots.header"
      :title="title"
      :description="description"
    >
      <slot name="header" />
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PaneHeader>
    <PaneToolbar v-if="search !== undefined || $slots.toolbar">
      <AlSearchBar
        v-if="search !== undefined"
        :model-value="search"
        :placeholder="searchPlaceholder"
        compact
        @update:model-value="emit('update:search', $event)"
      />
      <slot name="toolbar" />
      <template v-if="$slots.toolbarActions" #actions><slot name="toolbarActions" /></template>
    </PaneToolbar>
    <AlScrollArea class="min-h-0">
      <AlTabs
        v-if="tabs?.length"
        :model-value="activeTab"
        :tabs="tabs"
        class="pt-1"
        @update:model-value="emit('update:activeTab', $event)"
      >
        <template v-for="tab in tabs" :key="tab.value" #[tab.value]>
          <slot :name="`tab-${tab.value}`" />
        </template>
      </AlTabs>
      <slot v-else />
    </AlScrollArea>
    <footer
      v-if="$slots.footer"
      class="flex min-h-[var(--workbench-toolbar-height)] items-center border-t border-border bg-[var(--toolbar-surface,var(--background))] px-2.5 py-1 text-[0.6875rem] text-muted-foreground"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>

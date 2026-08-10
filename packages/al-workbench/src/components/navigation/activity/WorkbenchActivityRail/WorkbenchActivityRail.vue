<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkbenchActivities } from '../../../../composables/useWorkbenchActivities'
import { useWorkbenchHostChrome } from '../../../../composables/useWorkbenchHostChrome'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../../../core/workbench/contributions'
import type { WorkbenchLayoutNode } from '../../../../core/workbench/shell'
import { WorkbenchGlobalMenuLauncher } from '../../menus'
import WorkbenchActivityItem from './WorkbenchActivityItem.vue'
import WorkbenchActivityTabItem from './WorkbenchActivityTabItem.vue'

defineOptions({ name: 'WorkbenchActivityRail' })

const props = defineProps<{
  class?: string
}>()

const runtime = useWorkbenchRuntime()

const [AlIconButton, ScrollArea] = runtime.workbench.ui.getComponents([
  'AlIconButton',
  'ScrollArea',
])
const [ChevronLeft, ChevronRight, Plus, Settings] = runtime.workbench.ui.getIcons([
  'ChevronLeft',
  'ChevronRight',
  'Plus',
  'Settings',
])

const activities = useWorkbenchActivities()
const chrome = useWorkbenchHostChrome(runtime)
const items = activities.items
const draggingId = ref<string | null>(null)
const expanded = computed(
  () => runtime.settings.get<boolean>('workbench.layout.activityRail.expanded', false) === true,
)

function collectTabs(node: WorkbenchLayoutNode): WorkbenchTab[] {
  if (node.kind === 'group') return node.tabs
  return node.children.flatMap(collectTabs)
}

const browserTabs = computed(() =>
  collectTabs(runtime.workbench.state.layout).filter((tab) => tab.kind === 'browser'),
)
const activeTabId = computed(() => runtime.workbench.getActiveTab()?.id ?? null)

function handleDragStart(activityId: string) {
  draggingId.value = activityId
}

function handleDrop(targetActivityId: string) {
  if (draggingId.value) activities.reorder(draggingId.value, targetActivityId)
  draggingId.value = null
}

function toggleExpanded() {
  void runtime.settings.set('workbench.layout.activityRail.expanded', !expanded.value)
}

function activateTab(tab: WorkbenchTab) {
  runtime.workbench.activateTab(tab.id, tab.groupId)
  void runtime.workbench.persist()
}

function closeTab(tab: WorkbenchTab) {
  runtime.workbench.closeTab(tab.id, tab.groupId)
  void runtime.workbench.persist()
}
</script>

<template>
  <nav
    :class="[
      'wb-activity-bar',
      { 'wb-activity-bar--expanded': expanded },
      props.class,
    ]"
    :aria-label="expanded ? 'Expanded activity rail' : 'Activity rail'"
  >
    <div class="wb-activity-bar__header">
      <AlIconButton
        :label="expanded ? 'Collapse activity rail' : 'Expand activity rail'"
        :icon="expanded ? ChevronLeft : ChevronRight"
        variant="ghost"
        size="icon-sm"
        @click="toggleExpanded"
      />
    </div>
    <WorkbenchGlobalMenuLauncher v-if="!chrome.desktopChrome.value" placement="activityLauncher" />
    <div class="wb-activity-bar__items">
      <WorkbenchActivityItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :expanded="expanded"
        :dragging-id="draggingId"
        @activate="activities.activate"
        @dragstart="handleDragStart"
        @drop="handleDrop"
        @dragend="draggingId = null"
      />
    </div>

    <div class="wb-activity-bar__divider" />

    <ScrollArea class="wb-activity-bar__tabs">
      <div class="wb-activity-bar__tab-list">
        <WorkbenchActivityTabItem
          v-for="tab in browserTabs"
          :key="tab.id"
          :tab="tab"
          :active="activeTabId === tab.id"
          :expanded="expanded"
          @activate="activateTab"
          @close="closeTab"
        />
        <button
          type="button"
          class="wb-activity-bar__new-tab"
          :aria-label="expanded ? undefined : 'New browser tab'"
          @click="runtime.commands.execute('workbench.browser.newTab')"
        >
          <Plus class="size-4" />
          <span v-if="expanded">New browser tab</span>
        </button>
      </div>
    </ScrollArea>

    <button
      type="button"
      class="wb-activity-bar__settings"
      :aria-label="expanded ? undefined : 'Open settings'"
      @click="runtime.commands.execute('workbench.action.openSettings')"
    >
      <Settings class="size-4" />
      <span v-if="expanded">Settings</span>
    </button>
  </nav>
</template>
<style scoped>
.wb-activity-bar {
  display: flex;
  width: 3.125rem;
  height: 100%;
  flex-direction: column;
  gap: 0.25rem;
  background: transparent;
  padding: 0.375rem 0.375rem 0.5rem;
  transition: width 160ms ease;
}

.wb-activity-bar--expanded {
  width: clamp(16rem, 22vw, 24rem);
}

.wb-activity-bar__header {
  display: flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
}

.wb-activity-bar--expanded .wb-activity-bar__header {
  justify-content: flex-end;
}

.wb-activity-bar__items {
  display: flex;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.25rem;
}

.wb-activity-bar__divider {
  height: 1px;
  flex: 0 0 auto;
  margin: 0.25rem 0.5rem;
  background: color-mix(in srgb, var(--border) 72%, transparent);
}

.wb-activity-bar__tabs {
  min-height: 0;
  flex: 1;
}

.wb-activity-bar__tab-list {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.wb-activity-bar__new-tab,
.wb-activity-bar__settings {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 2rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pane-surface-raised) 72%, transparent);
  padding-inline: 0.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.wb-activity-bar--expanded .wb-activity-bar__new-tab,
.wb-activity-bar--expanded .wb-activity-bar__settings {
  justify-content: flex-start;
}

.wb-activity-bar__new-tab:hover,
.wb-activity-bar__settings:hover {
  background: var(--hover);
  color: var(--text-primary);
}

.wb-activity-bar__new-tab:focus-visible,
.wb-activity-bar__settings:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.wb-activity-bar__new-tab span,
.wb-activity-bar__settings span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}
</style>

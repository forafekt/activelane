<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import { useWorkbenchTabs } from '../../../../composables/useWorkbenchTabs'
import type { WorkbenchTabGroupNode } from '../../../../core/workbench/shell'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'
import WorkbenchTabContextMenu from './WorkbenchTabContextMenu.vue'
import WorkbenchTabGroupHeader from './WorkbenchTabGroupHeader.vue'
import WorkbenchTabItem from './WorkbenchTabItem.vue'

defineOptions({ name: 'WorkbenchTabStrip' })

const props = defineProps<{
  group: WorkbenchTabGroupNode
}>()

const runtime = useWorkbenchRuntime()

const [Ellipsis, SplitSquareHorizontal, SplitSquareVertical] = runtime.workbench.ui.getIcons([
  'Ellipsis',
  'SquareSplitHorizontal',
  'SquareSplitVertical',
])

const [AlDropdownMenu, AlIconButton, ScrollArea] = runtime.workbench.ui.getComponents([
  'AlDropdownMenu',
  'AlIconButton',
  'ScrollArea',
])

const tabs = useWorkbenchTabs(props.group)
const tabInteractions = useWorkbenchTabInteractions()
const activeTab = tabs.activeTab
const tabGroups = tabInteractions.tabGroups
const draggingId = ref<string | null>(null)
const draggingGroupId = ref<string | null>(null)
const filterQuery = ref('')

const toolbarActions = computed(() =>
  runtime.registry.tabToolbarActions.filter((item) =>
    activeTab.value ? !item.when || item.when === activeTab.value.kind || item.when === '*' : false,
  ),
)

const items = computed(() => [
  {
    id: 'workbench.tab.reopenClosed',
    label: 'Reopen Closed Tab',
  },
  ...toolbarActions.value.map((item) => ({
    id: item.id,
    label: item.title,
  })),
])

const normalizedFilter = computed(() => filterQuery.value.trim().toLowerCase())

function visibleTab(tab: { title: string; kind: string }) {
  const query = normalizedFilter.value
  if (!query) return true
  return tab.title.toLowerCase().includes(query) || tab.kind.toLowerCase().includes(query)
}

const visibleUngroupedTabs = computed(() => tabs.ungroupedTabs.value.filter(visibleTab))

function visibleGroupedTabs(tabGroupId: string) {
  return props.group.tabs.filter((tab) => tab.tabGroupId === tabGroupId && visibleTab(tab))
}

function drop(targetTabId: string) {
  const draggedTab = draggingId.value ? tabInteractions.tabById(draggingId.value) : null
  if (draggedTab) {
    void tabInteractions.runProtectedTabAction(
      draggedTab,
      'move it',
      () => runtime.workbench.reorderTab(draggedTab.id, targetTabId, props.group.id),
      { requireEditable: true },
    )
  }
  draggingId.value = null
}

async function dropIntoGroup(tabGroupId: string) {
  const draggedTab = draggingId.value ? tabInteractions.tabById(draggingId.value) : null
  if (draggedTab) {
    await tabInteractions.runProtectedTabAction(
      draggedTab,
      'move it',
      async () => {
        const targetGroup = tabInteractions.groupById(tabGroupId)
        if (targetGroup?.locked) {
          tabInteractions.notify(
            'Group is locked',
            `Unlock "${targetGroup.name}" before moving tabs into it.`,
            'warning',
          )
          return
        }
        if (!(await tabInteractions.requestUnlockGroup(tabGroupId, 'move tabs into it'))) return
        runtime.workbench.moveTabToTabGroup(draggedTab.id, tabGroupId, props.group.id)
      },
      { requireEditable: true },
    )
  }
  draggingId.value = null
}

function dropGroup(targetTabGroupId: string) {
  const draggedGroupId = draggingGroupId.value
  if (draggedGroupId && draggedGroupId !== targetTabGroupId) {
    void tabInteractions.runProtectedGroupAction(
      draggedGroupId,
      'move it',
      () => runtime.workbench.reorderTabGroup(draggedGroupId, targetTabGroupId, props.group.id),
      { requireEditable: true },
    )
  }
  draggingGroupId.value = null
}

function activateTab(tabId: string) {
  const tab = tabInteractions.tabById(tabId)
  if (!tab) return
  void tabInteractions.runProtectedTabAction(tab, 'open it', () =>
    runtime.workbench.activateTab(tab.id, props.group.id),
  )
}

function closeTab(tabId: string) {
  const tab = tabInteractions.tabById(tabId)
  if (!tab) return
  if (tab.closable === false) {
    tabInteractions.notify('Tab cannot be closed', `"${tab.title}" is not closable.`, 'warning')
    return
  }
  void tabInteractions.runProtectedTabAction(
    tab,
    'close it',
    () => runtime.workbench.closeTab(tab.id, props.group.id),
    { requireEditable: true },
  )
}

function executeAction(id: string) {
  if (id === 'workbench.tab.reopenClosed') {
    runtime.workbench.reopenClosedTab(props.group.id)
    void runtime.workbench.persist()
    return
  }
  void runtime.commands.execute(id)
}
</script>

<template>
  <nav class="wb-tab-strip" data-workbench-part="editorTabs">
    <ScrollArea
      orientation="horizontal"
      class="w-full"
      content-class="flex flex-row"
      role="tablist"
      aria-label="Open tabs"
    >
      <WorkbenchTabItem
        v-for="tab in visibleUngroupedTabs"
        :key="tab.id"
        :tab="tab"
        :active="tab.id === activeTab?.id"
        :dragging-id="draggingId"
        :close-blocked="tabInteractions.isCloseBlocked(tab) || tabInteractions.isProtectionLocked(tab)"
        :drag-blocked="tab.locked || Boolean(tabInteractions.tabGroupForTab(tab)?.locked)"
        @activate="activateTab"
        @persist="tabs.persistPreview"
        @close="closeTab"
        @dragstart="draggingId = $event"
        @drop="drop"
        @dragend="draggingId = null"
      >
        <template #context-menu>
          <WorkbenchTabContextMenu :tab="tab" :group="group" />
        </template>
      </WorkbenchTabItem>
      <template v-for="tabGroup in tabGroups" :key="tabGroup.id">
        <WorkbenchTabGroupHeader
          :group="group"
          :tab-group="tabGroup"
          :dragging-id="draggingId"
          :dragging-group-id="draggingGroupId"
          @dragstart-group="draggingGroupId = $event"
          @drop-group="dropGroup"
          @dragend-group="draggingGroupId = null"
          @drop-tab="dropIntoGroup"
        />
        <WorkbenchTabItem
          v-for="tab in tabGroup.collapsed ? [] : visibleGroupedTabs(tabGroup.id)"
          :key="tab.id"
          :tab="tab"
          :active="tab.id === activeTab?.id"
          :dragging-id="draggingId"
          :close-blocked="tabInteractions.isCloseBlocked(tab) || tabInteractions.isProtectionLocked(tab)"
          :drag-blocked="tab.locked || Boolean(tabInteractions.tabGroupForTab(tab)?.locked)"
          @activate="activateTab"
          @persist="tabs.persistPreview"
          @close="closeTab"
          @dragstart="draggingId = $event"
          @drop="drop"
          @dragend="draggingId = null"
        >
          <template #context-menu>
            <WorkbenchTabContextMenu :tab="tab" :group="group" />
          </template>
        </WorkbenchTabItem>
      </template>
    </ScrollArea>

    <div class="wb-tab-strip__actions">
      <input
        v-if="group.tabs.length > 8"
        v-model="filterQuery"
        class="wb-tab-strip__filter"
        type="search"
        aria-label="Filter open tabs"
        placeholder="Filter"
      >
      <AlIconButton
        v-for="action in toolbarActions"
        :key="action.id"
        :label="action.title"
        :icon="action.icon"
        size="icon-xs"
        variant="ghost"
        @click="runtime.commands.execute(action.commandId)"
      />
      <AlIconButton
        label="Split right"
        :icon="SplitSquareHorizontal"
        size="icon-xs"
        variant="ghost"
        @click="runtime.workbench.splitActiveTabRight()"
      />
      <AlIconButton
        label="Split down"
        :icon="SplitSquareVertical"
        size="icon-xs"
        variant="ghost"
        @click="runtime.workbench.splitActiveTabDown()"
      />
      <AlDropdownMenu v-if="items.length > 0" :items="items" @select="executeAction">
        <template #trigger>
          <AlIconButton label="More actions" :icon="Ellipsis" size="icon-xs" variant="ghost" />
        </template>
      </AlDropdownMenu>
    </div>
  </nav>
</template>
<style scoped>
.wb-tab-strip {
  display: flex;
  min-width: 0;
  min-height: 2rem;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 86%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--foreground) 4%, transparent);
}

.wb-tab-strip__scroller {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: row;
  /* overflow-x: hidden;
  overflow-y: hidden; */
  /* scrollbar-width: thin; */
}

.wb-tab-strip__actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0.0625rem;
  border-left: 1px solid var(--border);
  padding: 0 0.25rem;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
}

.wb-tab-strip__filter {
  width: 7rem;
  height: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--background);
  padding: 0 0.5rem;
  color: var(--text-primary);
  font-size: 0.75rem;
}

.wb-tab-strip__filter:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}
</style>

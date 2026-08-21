<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { getComponent } from '@activelane/ui'
import { computed, ref } from 'vue'
import { useWorkbenchActivities } from '../../../../composables/useWorkbenchActivities'
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

const IconButton = getComponent('icon-button')
const Button = getComponent('button')

const [, ScrollArea] = runtime.workbench.ui.getComponents(['IconButton', 'ScrollArea'])
const ChevronLeft = getIcon('lucide:chevron-left')
const ChevronRight = getIcon('lucide:chevron-right')
const Plus = getIcon('lucide:plus')
const Settings = getIcon('lucide:settings')

const activities = useWorkbenchActivities()
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

const computedNavClass = computed(() => [
  'wb-activity-bar',
  { 'wb-activity-bar--expanded': expanded.value },
  props.class,
])
</script>

<template>
  <nav
    :class="computedNavClass"
    :aria-label="expanded ? 'Expanded activity rail' : 'Activity rail'"
  >
    <div class="wb-activity-bar__header">
      <IconButton
        :label="expanded ? 'Collapse activity rail' : 'Expand activity rail'"
        size="tiny"
        @click="toggleExpanded"
      >
        <ChevronLeft v-if="expanded" />
        <ChevronRight v-else />
      </IconButton>
    </div>
    <WorkbenchGlobalMenuLauncher
      v-if="runtime.host.kind !== 'desktop'"
      placement="activityLauncher"
    />
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
        <Button
          class="wb-activity-bar__new-tab"
          :aria-label="expanded ? undefined : 'New browser tab'"
          @click="runtime.commands.execute('workbench.browser.newTab')"
          quaternary
        >
          <template #icon>
            <Plus />
          </template>
          <span v-if="expanded">New browser tab</span>
        </Button>
      </div>
    </ScrollArea>

    <Button
      class="wb-activity-bar__settings"
      :aria-label="expanded ? undefined : 'Open settings'"
      @click="runtime.commands.execute('workbench.action.openSettings')"
      quaternary
    >
      <template #icon>
        <Settings />
      </template>
      <span v-if="expanded">Settings</span>
    </Button>
  </nav>
</template>

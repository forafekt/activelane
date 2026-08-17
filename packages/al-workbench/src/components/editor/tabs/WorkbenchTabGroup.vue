<script setup lang="ts">
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { useWorkbenchTabs } from '../../../composables/useWorkbenchTabs'
import type { WorkbenchTabGroupNode } from '../../../core/workbench/shell'
import WorkbenchSurfaceRenderer from '../../layout/WorkbenchSurfaceRenderer.vue'
import { provideWorkbenchTabInteractions } from './useWorkbenchTabInteractions'
import WorkbenchTabInteractionDialogs from './WorkbenchTabInteractionDialogs.vue'
import WorkbenchTabStrip from './WorkbenchTabStrip.vue'

defineOptions({ name: 'WorkbenchTabGroup' })

const props = defineProps<{
  group: WorkbenchTabGroupNode
}>()

const runtime = useWorkbenchRuntime()

const Shield = runtime.workbench.ui.getIcon('lucide.shield')
const Snowflake = runtime.workbench.ui.getIcon('lucide.snowflake')
const Star = runtime.workbench.ui.getIcon('lucide.star')
const [AlButton, AlEmptyState] = runtime.workbench.ui.getComponents(['AlButton', 'AlEmptyState'])

const tabs = useWorkbenchTabs(props.group)
const tabInteractions = provideWorkbenchTabInteractions(props.group)
const activeTab = tabs.activeTab

function markActiveTabEngaged() {
  if (activeTab.value?.preview) tabs.markEngaged(activeTab.value.id)
}

function unlockActiveTab() {
  if (!activeTab.value) return
  void tabInteractions.requestUnlockTab(activeTab.value.id, 'open it')
}

function wakeActiveTab() {
  if (!activeTab.value) return
  runtime.workbench.tabs.wakeTab(activeTab.value.id, props.group.id)
  runtime.workbench.activateTab(activeTab.value.id, props.group.id)
  void runtime.workbench.persist()
}
</script>

<template>
  <!-- biome-ignore lint/a11y/useSemanticElements: the tab group is a structural section, not a form fieldset. -->
  <section
    role="group"
    data-workbench-tab-group="true"
    :data-active-group-id="runtime.workbench.state.activeGroupId"
    :data-active-tab-id="activeTab?.id"
    class="wb-tab-group wb-structural-pane"
    :class="{ 'wb-tab-group--active': runtime.workbench.state.activeGroupId === group.id }"
    @mousedown="runtime.workbench.setActiveGroup(group.id)"
  >
    <WorkbenchTabStrip
      v-if="runtime.settings.get<boolean>('workbench.layout.tabs.visible') !== false"
      :group="group"
    />

    <div :data-surface-id="activeTab?.surfaceId" class="wb-tab-group__content">
      <!-- biome-ignore lint/a11y/noStaticElementInteractions: capture handlers observe engagement within arbitrary extension content. -->
      <div
        v-if="activeTab && !activeTab.hibernation?.hibernated && !tabInteractions.isProtectionLocked(activeTab)"
        data-workbench-surface-render
        class="wb-tab-group__surface"
        @pointerdown.capture="markActiveTabEngaged"
        @keydown.capture="markActiveTabEngaged"
        @submit.capture="markActiveTabEngaged"
      >
        <WorkbenchSurfaceRenderer :tab="activeTab" />
      </div>

      <AlEmptyState
        v-else-if="activeTab?.hibernation?.hibernated"
        class="p-3"
        title="Hibernated tab"
        description="Wake this tab to restore its work surface."
      >
        <template #icon><Snowflake class="size-5" /></template>
        <template #action>
          <AlButton size="sm" variant="secondary" @click="wakeActiveTab"> Wake Tab </AlButton>
        </template>
      </AlEmptyState>

      <AlEmptyState
        v-else-if="activeTab"
        class="p-3"
        title="Protected tab"
        description="Unlock this tab or its group to show the work surface for this session."
      >
        <template #icon><Shield class="size-5" /></template>
        <template #action>
          <AlButton size="sm" variant="secondary" @click="unlockActiveTab"> Unlock </AlButton>
        </template>
      </AlEmptyState>

      <AlEmptyState
        v-else
        class="p-3"
        title="No tabs in this group"
        description="Open a contributed command or sidebar action to populate this work surface."
      >
        <template #icon><Star class="size-5" /></template>
        <template #action>
          <AlButton
            size="sm"
            variant="secondary"
            @click="runtime.commands.execute('workbench.showApps')"
          >
            Show Apps
          </AlButton>
        </template>
      </AlEmptyState>
    </div>

    <WorkbenchTabInteractionDialogs />
  </section>
</template>

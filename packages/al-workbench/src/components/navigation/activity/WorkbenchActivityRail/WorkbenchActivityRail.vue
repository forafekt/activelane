<script setup lang="ts">
import { cn } from '@activelane/shadcn'
import { computed, ref } from 'vue'
import { useWorkbenchActivities } from '../../../../composables/useWorkbenchActivities'
import { useWorkbenchHostChrome } from '../../../../composables/useWorkbenchHostChrome'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import { WorkbenchGlobalMenuLauncher } from '../../menus'
import WorkbenchActivityItem from './WorkbenchActivityItem.vue'

defineOptions({ name: 'WorkbenchActivityRail' })

const props = defineProps<{
  class?: string
}>()

const runtime = useWorkbenchRuntime()

const [AlIconButton] = runtime.workbench.ui.getComponents(['AlIconButton'])

const activities = useWorkbenchActivities()
const chrome = useWorkbenchHostChrome(runtime)
const items = activities.items
const showGlobalMenuInActivityLauncher = chrome.showGlobalMenuInActivityLauncher
const draggingId = ref<string | null>(null)

const railClass = computed(() => ['wb-activity-bar', props.class].filter(Boolean).join(' '))

function handleDragStart(activityId: string) {
  draggingId.value = activityId
}

function handleDrop(targetActivityId: string) {
  if (draggingId.value) activities.reorder(draggingId.value, targetActivityId)
  draggingId.value = null
}
</script>

<template>
  <nav :class="cn('flex h-full flex-col items-center gap-1 p-2', railClass)">
    <WorkbenchGlobalMenuLauncher v-if="!chrome.desktopChrome.value" placement="activityLauncher" />
    <div class="wb-activity-bar__items">
      <WorkbenchActivityItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :dragging-id="draggingId"
        @activate="activities.activate"
        @dragstart="handleDragStart"
        @drop="handleDrop"
        @dragend="draggingId = null"
      />
    </div>

    <!-- <AlIconButton
      label="Show apps"
      :icon="runtime.workbench.ui.getIcon('LayoutGrid')"
      variant="ghost"
      size="icon"
      class="mt-auto"
      @click="runtime.commands.execute('workbench.launcher.showApps')"
    /> -->
    <!-- <AlIconButton
      label="Focus command bar"
      :icon="runtime.workbench.ui.getIcon('Command')"
      variant="ghost"
      size="icon"
      class="mt-1"
      @click="runtime.workbench.setCommandPaletteOpen(true)"
    /> -->
    <AlIconButton
      label="Open settings"
      :icon="runtime.workbench.ui.getIcon('Settings')"
      variant="ghost"
      size="icon"
      class="mb-2 mt-1"
      @click="runtime.commands.execute('workbench.action.openSettings')"
    />
  </nav>
</template>
<style scoped>
.wb-activity-bar {
  display: flex;
  width: 3.125rem;
  height: 100%;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  /* border-right: 1px solid var(--border); */
  background: var(--panel);
  padding-top: 0.375rem;
  /* box-shadow: inset -1px 0 0 var(--border); */
}

.wb-activity-bar__items {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
</style>

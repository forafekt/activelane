<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import type { WorkbenchActivityContribution } from '../../../../core/workbench/contributions'

defineOptions({ name: 'WorkbenchActivityItem' })

const props = defineProps<{
  item: WorkbenchActivityContribution
  draggingId?: string | null
  expanded?: boolean
}>()

const emit = defineEmits<{
  activate: [id: string]
  dragstart: [id: string]
  dragover: [id: string, event: DragEvent]
  drop: [id: string]
  dragend: []
}>()

const runtime = useWorkbenchRuntime()

const [
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuTrigger,
] = runtime.workbench.ui.getComponents([
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuLabel',
  'ContextMenuSeparator',
  'ContextMenuItem',
  'ContextMenuTrigger',
])

const active = computed(() => runtime.workbench.state.activeActivityId === props.item.id)
const icon = computed(() =>
  typeof props.item.icon === 'string'
    ? runtime.workbench.ui.getIcon(props.item.icon)
    : props.item.icon,
)
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <button
        type="button"
        class="wb-activity-item"
        :class="{
          'wb-activity-item--active': active,
          'wb-activity-item--expanded': expanded,
          'wb-activity-item--drop-target': draggingId && draggingId !== item.id,
        }"
        :title="expanded ? undefined : item.title"
        draggable="true"
        @click="emit('activate', item.id)"
        @dragstart="emit('dragstart', item.id)"
        @dragover.prevent="emit('dragover', item.id, $event)"
        @drop.prevent="emit('drop', item.id)"
        @dragend="emit('dragend')"
      >
        <component :is="icon" v-if="icon" class="size-4" />
        <span v-else class="text-xs font-semibold">{{ item.title.slice(0, 1) }}</span>
        <span v-if="expanded" class="wb-activity-item__label">{{ item.title }}</span>
        <span v-if="item.badge" class="wb-activity-item__badge">{{ item.badge.value }}</span>
      </button>
    </ContextMenuTrigger>
    <ContextMenuContent class="w-56">
      <ContextMenuLabel>{{ item.title }}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem @select="emit('activate', item.id)">Open</ContextMenuItem>
      <ContextMenuItem @select="runtime.workbench.setCommandPaletteOpen(true)">
        Show Commands
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

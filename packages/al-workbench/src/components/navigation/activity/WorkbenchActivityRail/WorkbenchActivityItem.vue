<script setup lang="ts">
import { getComponent } from '@activelane/ui'
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import type { WorkbenchActivityContribution } from '../../../../core/workbench/contributions'

const Button = getComponent('button')

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

// const [
//   ContextMenu,
//   ContextMenuContent,
//   ContextMenuLabel,
//   ContextMenuSeparator,
//   ContextMenuItem,
//   ContextMenuTrigger,
// ] = runtime.workbench.ui.getComponents([
//   'ContextMenu',
//   'ContextMenuContent',
//   'ContextMenuLabel',
//   'ContextMenuSeparator',
//   'ContextMenuItem',
//   'ContextMenuTrigger',
// ])

const active = computed(() => runtime.workbench.state.activeActivityId === props.item.id)
const icon = computed(() =>
  typeof props.item.icon === 'string'
    ? runtime.workbench.ui.getIcon(props.item.icon)
    : props.item.icon,
)
const computedClass = computed(() => {
  return {
    'wb-activity-item--active': active.value,
    'wb-activity-item--expanded': props.expanded,
    'wb-activity-item--drop-target': props.draggingId && props.draggingId !== props.item.id,
  }
})
</script>

<template>
  <Button
    class="wb-activity-item"
    :class="computedClass"
    :aria-label="expanded ? undefined : item.title"
    :title="expanded ? undefined : item.title"
    draggable="true"
    @click="emit('activate', item.id)"
    @dragstart="emit('dragstart', item.id)"
    @dragover.prevent="emit('dragover', item.id, $event)"
    @drop.prevent="emit('drop', item.id)"
    @dragend="emit('dragend')"
    quaternary
    :size="expanded ? 'small' : 'large'"
  >
    <template #icon>
      <component :is="icon" />
    </template>
    <span v-if="!icon" class="text-xs font-semibold">{{ item.title.slice(0, 1) }}</span>
    <span v-if="expanded" class="wb-activity-item__label">{{ item.title }}</span>
    <span v-if="item.badge?.value" class="wb-activity-item__badge">{{ item.badge.value }}</span>
  </Button>
</template>

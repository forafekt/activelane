<script setup lang="ts">
import type { WorkbenchActivityContribution } from '@activelane/workbench-api'
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchActivityItem' })

const props = defineProps<{
  item: WorkbenchActivityContribution
  draggingId?: string | null
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
          'wb-activity-item--drop-target': draggingId && draggingId !== item.id,
        }"
        :title="item.title"
        draggable="true"
        @click="emit('activate', item.id)"
        @dragstart="emit('dragstart', item.id)"
        @dragover.prevent="emit('dragover', item.id, $event)"
        @drop.prevent="emit('drop', item.id)"
        @dragend="emit('dragend')"
      >
        <component :is="icon" v-if="icon" class="size-5" />
        <span v-else class="text-xs font-semibold">{{ item.title.slice(0, 1) }}</span>
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
<style scoped>
.wb-activity-item {
  position: relative;
  display: flex;
  width: 2.35rem;
  height: 2.35rem;
  align-items: center;
  justify-content: center;
  border: 1px inset transparent;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.wb-activity-item:hover,
.wb-activity-item--active {
  color: var(--text-primary);
  background: var(--hover);
}

.wb-activity-item--active {
  border-color: color-mix(in srgb, var(--focus-ring) 28%, transparent);
  background: var(--selected);
  box-shadow: var(--elevation-1);
}

.wb-activity-item:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.wb-activity-item--drop-target::after {
  position: absolute;
  right: 0.25rem;
  bottom: 0;
  left: 0.25rem;
  height: 2px;
  content: "";
  background: var(--focus-ring);
}

.wb-activity-item__badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  min-width: 1rem;
  border-radius: 999px;
  background: var(--focus-ring);
  color: var(--primary-foreground);
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1rem;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../../core/workbench/contributions'
import { tabColorClass } from './tabPresentation'
import WorkbenchTabIndicator from './WorkbenchTabIndicator.vue'

defineOptions({ name: 'WorkbenchTabItem' })

const runtime = useWorkbenchRuntime()
const [Lock, Pin, Shield, Snowflake, X] = runtime.workbench.ui.getIcons([
  'Lock',
  'Pin',
  'Shield',
  'Snowflake',
  'X',
])
const [AlIconButton, ContextMenu, ContextMenuTrigger] = runtime.workbench.ui.getComponents([
  'AlIconButton',
  'ContextMenu',
  'ContextMenuTrigger',
])

const props = defineProps<{
  tab: WorkbenchTab
  active: boolean
  draggingId?: string | null
  closeBlocked?: boolean
  dragBlocked?: boolean
}>()

const emit = defineEmits<{
  activate: [id: string]
  persist: [id: string]
  close: [id: string]
  dragstart: [id: string]
  dragover: [id: string, event: DragEvent]
  drop: [id: string]
  dragend: []
}>()

const computedClass = computed(() => {
  return {
    'wb-tab--active': props.active,
    'wb-tab--pinned': props.tab.pinned,
    'wb-tab--preview': props.tab.preview,
    'wb-tab--dirty': props.tab.dirty,
    'wb-tab--drop-target': props.draggingId && props.draggingId !== props.tab.id,
    'wb-tab--locked': props.tab.locked,
    'wb-tab--protected': props.tab.protection,
    [tabColorClass(props.tab.color)]: true,
  }
})
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        tabindex="0"
        class="wb-tab"
        :class="computedClass"
        :data-tab-id="tab.id"
        :data-tab-preview="tab.preview"
        draggable="true"
        role="tab"
        :aria-selected="active"
        :aria-label="`${tab.title}${tab.locked ? ', locked' : ''}${tab.protection ? ', protected' : ''}`"
        @auxclick="$event.button === 1 ? emit('close', tab.id) : undefined"
        @dragstart="dragBlocked ? $event.preventDefault() : emit('dragstart', tab.id)"
        @dragover.prevent="emit('dragover', tab.id, $event)"
        @drop.prevent="emit('drop', tab.id)"
        @dragend="emit('dragend')"
      >
        <button
          type="button"
          class="wb-tab__button"
          :title="tab.title"
          @click="emit('activate', tab.id)"
          @dblclick="emit('persist', tab.id)"
        >
          <Pin v-if="tab.pinned" class="size-4" />
          <component :is="tab.icon" v-else-if="tab.icon" class="size-4" />
          <span v-if="tab.dirty" class="wb-tab__dirty" role="img" aria-label="Unsaved changes" />
          <span
            v-if="tab.preview"
            class="wb-tab__preview-dot"
            role="img"
            aria-label="Preview tab"
          />
          <span class="wb-tab__title">{{ tab.title }}</span>
          <span v-if="tab.indicators?.length" class="wb-tab__indicators">
            <WorkbenchTabIndicator
              v-for="indicator in tab.indicators.slice(0, 3)"
              :key="indicator.id"
              :indicator="indicator"
            />
          </span>
          <Snowflake
            v-else-if="tab.hibernation?.hibernated"
            class="wb-tab__state-icon"
            aria-label="Hibernated tab"
          />
          <Lock v-if="tab.locked" class="wb-tab__state-icon" aria-label="Locked tab" />
          <Shield v-if="tab.protection" class="wb-tab__state-icon" aria-label="Protected tab" />
        </button>
        <AlIconButton
          v-if="tab.closable !== false && !closeBlocked"
          label="Close tab"
          :icon="X"
          size="icon-xs"
          variant="ghost"
          class="wb-tab__close"
          @click.stop="emit('close', tab.id)"
        />
      </div>
    </ContextMenuTrigger>
    <slot name="context-menu" />
  </ContextMenu>
</template>

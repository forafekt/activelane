<script setup lang="ts">
import type { WorkbenchTab } from '@activelane/workbench-api'
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
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
          <span v-if="tab.dirty" class="wb-tab__dirty" aria-label="Unsaved changes" />
          <span v-if="tab.preview" class="wb-tab__preview-dot" aria-label="Preview tab" />
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
<style scoped>
.wb-tab {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  width: clamp(7rem, 18vw, 14rem);
  max-width: 14rem;
  min-height: 2rem;
  border-right: 1px solid var(--border);
  border-top: 2px solid transparent;
  border-left: 3px solid transparent;
  color: var(--text-muted);
  background: transparent;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    box-shadow 120ms ease;
}

.wb-tab-color--blue {
  border-left-color: color-mix(in srgb, var(--focus-ring) 82%, transparent);
}

.wb-tab-color--green {
  border-left-color: color-mix(in srgb, var(--success) 82%, transparent);
}

.wb-tab-color--amber {
  border-left-color: color-mix(in srgb, var(--warning) 82%, transparent);
}

.wb-tab-color--rose {
  border-left-color: color-mix(in srgb, var(--destructive) 72%, transparent);
}

.wb-tab-color--violet {
  border-left-color: color-mix(in srgb, var(--accent) 82%, var(--focus-ring));
}

.wb-tab-color--slate {
  border-left-color: color-mix(in srgb, var(--text-muted) 70%, transparent);
}

.wb-tab--pinned {
  width: 8.5rem;
  background: var(--preview);
}

.wb-tab--active {
  border-top-color: var(--focus-ring);
  color: var(--text-primary);
  background: var(--tab-active);
  box-shadow: var(--elevation-1);
}

.wb-tab:hover {
  color: var(--text-primary);
  background: var(--hover);
}

.wb-tab--drop-target::before {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0;
  width: 2px;
  content: "";
  background: var(--focus-ring);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--focus-ring) 18%, transparent);
}

.wb-tab__button {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  background: transparent;
  padding: 0 0.5rem;
  color: inherit;
  cursor: pointer;
}

.wb-tab__button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.wb-tab__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.wb-tab--preview .wb-tab__title {
  font-style: italic;
}

.wb-tab__dirty {
  flex: 0 0 auto;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background: var(--dirty);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dirty) 18%, transparent);
}

.wb-tab__preview-dot {
  flex: 0 0 auto;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--text-muted);
}

.wb-tab__state-icon {
  flex: 0 0 auto;
  width: 0.8125rem;
  height: 0.8125rem;
  color: var(--text-muted);
}

.wb-tab__indicators {
  display: inline-flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.125rem;
}

.wb-tab__close {
  align-self: center;
  margin-right: 0.125rem;
  opacity: 0;
}

.wb-tab:hover .wb-tab__close,
.wb-tab--active .wb-tab__close {
  opacity: 1;
}
</style>

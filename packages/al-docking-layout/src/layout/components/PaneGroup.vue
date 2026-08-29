<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { useLayout } from '../composables/useLayout'
import { groupActions, paneActions } from '../core/context-actions'
import type { DragController } from '../core/drag'
import { surfaceMountRegistryKey } from '../core/surfaces'
import type { ContextAction, PaneGroupNode, PaneInstance } from '../core/types'
import ContextMenu from './ContextMenu.vue'
import DockOverlay from './DockOverlay.vue'

const props = defineProps<{ group: PaneGroupNode }>()
const store = useLayout()
const injectedDrag = inject<DragController>('layout-drag')
if (!injectedDrag) throw new Error('PaneGroup must be rendered inside LayoutRoot')
const drag: DragController = injectedDrag
const surfaceMounts = inject(surfaceMountRegistryKey)
if (!surfaceMounts) throw new Error('PaneGroup must be rendered inside LayoutRoot')
const visibleTabs = computed(() =>
  props.group.tabs.filter((tab) => !props.group.hiddenTabIds.includes(tab.id)),
)
const active = computed(
  () => visibleTabs.value.find((tab) => tab.id === props.group.activeTabId) ?? visibleTabs.value[0],
)
const menu = ref<{ x: number; y: number; actions: ContextAction[] } | null>(null)
const insertionX = ref<number | null>(null)
onBeforeUnmount(() => surfaceMounts.setContent(props.group.id, null))

function drop(state: Readonly<typeof drag.state>) {
  if (!state.payload || !state.targetGroupId || !state.position) return
  store.dock(
    state.payload.groupId,
    state.payload.paneId,
    state.targetGroupId,
    state.position,
    state.insertionIndex ?? undefined,
  )
}
function startTab(event: PointerEvent, pane: PaneInstance) {
  if (pane.movable === false || (event.target as HTMLElement).closest('[data-no-drag]')) return
  drag.press(event, { kind: 'tab', groupId: props.group.id, paneId: pane.id }, drop)
}
function startGroup(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('[data-no-drag]')) return
  drag.press(event, { kind: 'group', groupId: props.group.id }, drop)
}
function trackTabs(event: PointerEvent) {
  if (drag.state.phase !== 'dragging' || drag.state.payload?.kind !== 'tab') return
  const strip = event.currentTarget as HTMLElement
  const tabs = [...strip.querySelectorAll<HTMLElement>('[data-tab-id]')]
  const visibleIndex = tabs.findIndex(
    (tab) =>
      event.clientX < tab.getBoundingClientRect().left + tab.getBoundingClientRect().width / 2,
  )
  const before = visibleIndex < 0 ? tabs.length : visibleIndex
  const nextTab = visibleTabs.value[before]
  const actualIndex = nextTab
    ? props.group.tabs.findIndex((tab) => tab.id === nextTab.id)
    : props.group.tabs.length
  const stripRect = strip.getBoundingClientRect()
  insertionX.value =
    before < tabs.length
      ? tabs[before].getBoundingClientRect().left - stripRect.left
      : (tabs.at(-1)?.getBoundingClientRect().right ?? stripRect.left) - stripRect.left
  drag.target(props.group.id, 'center', actualIndex)
}
function tabContext(event: MouseEvent, pane: PaneInstance) {
  event.preventDefault()
  menu.value = {
    x: event.clientX,
    y: event.clientY,
    actions: paneActions(store, props.group, pane),
  }
}
function groupContext(event: MouseEvent) {
  event.preventDefault()
  menu.value = { x: event.clientX, y: event.clientY, actions: groupActions(store, props.group) }
}
function keyboardContext(event: KeyboardEvent, actions: ContextAction[]) {
  if (!(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  menu.value = { x: rect.left + 12, y: rect.bottom, actions }
}
</script>

<template>
  <article
    class="pane-group"
    :class="{ 'has-pane-title': group.header?.visible }"
    :data-group-id="group.id"
  >
    <header
      v-if="group.header?.visible"
      class="pane-titlebar"
      role="toolbar"
      :aria-label="`${group.header.title ?? 'Pane'} actions and drag handle`"
      tabindex="0"
      @pointerdown="startGroup"
      @contextmenu="groupContext"
      @keydown="keyboardContext($event, groupActions(store, group))"
    >
      <span v-if="group.header.icon" class="pane-titlebar__icon" aria-hidden="true"
        >{{ group.header.icon }}</span
      >
      <strong>{{ group.header.title ?? 'Pane' }}</strong>
      <div class="pane-titlebar__actions" data-no-drag>
        <button
          v-if="group.hiddenTabIds.length"
          type="button"
          title="Show hidden tabs"
          @click="groupContext($event)"
        >
          ＋{{ group.hiddenTabIds.length }}
        </button>
        <button
          v-if="group.header.fullscreen !== false"
          type="button"
          :title="store.state.fullscreenGroupId === group.id ? 'Restore' : 'Fullscreen'"
          @click="store.toggleFullscreen(group.id)"
        >
          ▣
        </button>
        <button
          v-if="group.header.close"
          type="button"
          title="Hide pane"
          @click="store.hideGroup(group.id)"
        >
          ×
        </button>
      </div>
    </header>
    <div
      class="pane-tabbar"
      role="toolbar"
      aria-label="Tab strip"
      :class="{ 'is-drop-target': drag.state.targetGroupId === group.id && drag.state.insertionIndex !== null }"
      @pointermove="trackTabs"
      @pointerenter="trackTabs"
      @contextmenu.self="groupContext"
    >
      <div class="pane-tabs" role="tablist">
        <div
          v-for="(pane, index) in visibleTabs"
          :key="pane.id"
          :data-tab-id="pane.id"
          class="pane-tab"
          :class="{ 'is-active': pane.id === active?.id }"
          role="tab"
          :tabindex="pane.id === active?.id ? 0 : -1"
          :aria-selected="pane.id === active?.id"
          @click="store.activate(group.id, pane.id)"
          @keydown.enter="store.activate(group.id, pane.id)"
          @keydown.space.prevent="store.activate(group.id, pane.id)"
          @keydown="keyboardContext($event, paneActions(store, group, pane))"
          @pointerdown="startTab($event, pane)"
          @contextmenu="tabContext($event, pane)"
          @keydown.alt.left="store.reorder(group.id, pane.id, Math.max(0, group.tabs.indexOf(pane) - 1))"
          @keydown.alt.right="store.reorder(group.id, pane.id, group.tabs.indexOf(pane) + 1)"
        >
          <span v-if="typeof store.registry.get(pane.type)?.icon === 'string'" aria-hidden="true"
            >{{ store.registry.get(pane.type)?.icon }}</span
          >
          <span>{{ pane.title ?? store.registry.get(pane.type)?.title ?? pane.type }}</span>
          <button
            v-if="pane.closable !== false"
            type="button"
            data-no-drag
            class="pane-tab__close"
            aria-label="Close"
            @pointerdown.stop
            @click.stop="store.closePane(pane.id)"
          >
            ×
          </button>
        </div>
      </div>
      <button
        v-if="group.hiddenTabIds.length"
        type="button"
        data-no-drag
        class="pane-tabbar__hidden"
        :aria-label="`Show ${group.hiddenTabIds.length} hidden tabs`"
        @click="groupContext($event)"
      >
        ＋{{ group.hiddenTabIds.length }}
      </button>
      <span
        v-if="drag.state.phase === 'dragging' && drag.state.payload?.kind === 'tab' && drag.state.targetGroupId === group.id && insertionX !== null"
        class="tab-insertion"
        :style="{ '--tab-insertion-x': `${insertionX}px` }"
      />
    </div>
    <main
      :ref="(element) => surfaceMounts.setContent(group.id, element as HTMLElement | null)"
      class="pane-content"
    >
      <div v-if="!active" class="pane-empty">
        {{ group.hiddenTabIds.length ? 'All tabs are hidden' : 'No pane selected' }}
      </div>
    </main>
    <DockOverlay v-if="drag.state.phase === 'dragging'" :group-id="group.id" :controller="drag" />
    <ContextMenu v-if="menu" :x="menu.x" :y="menu.y" :actions="menu.actions" @close="menu = null" />
  </article>
</template>

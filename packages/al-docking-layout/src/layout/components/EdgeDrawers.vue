<script setup lang="ts">
import { ref } from 'vue'
import { useLayout } from '../composables/useLayout'
import type { Edge } from '../core/types'

const store = useLayout()
const preview = ref<string | null>(null)
const edges: Edge[] = ['left', 'right', 'top', 'bottom']
function enter(id: string) {
  preview.value = id
}
function leave(event: FocusEvent | PointerEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !(event.currentTarget as HTMLElement).parentElement?.contains(next))
    preview.value = null
}
</script>
<template>
  <nav
    v-for="edge in edges"
    :key="edge"
    class="edge-drawer"
    :class="`edge-drawer--${edge}`"
    :aria-label="`${edge} collapsed panes`"
  >
    <button
      type="button"
      v-for="item in store.collapsedAt(edge)"
      :key="item.group.id"
      @pointerenter="enter(item.group.id)"
      @pointerleave="leave"
      @focus="enter(item.group.id)"
      @blur="leave"
      @click="store.expand(item.group.id)"
    >
      {{ item.group.tabs.find(tab => tab.id === item.group.activeTabId)?.title ?? store.registry.get(item.group.tabs[0]?.type)?.title }}
    </button>
  </nav>
  <aside
    v-for="item in store.state.collapsed"
    v-show="preview === item.group.id"
    :key="`preview-${item.group.id}`"
    class="drawer-preview"
    :class="`drawer-preview--${item.edge}`"
    @pointerenter="enter(item.group.id)"
    @pointerleave="leave"
  >
    <strong>{{ item.group.tabs[0]?.title ?? 'Collapsed group' }}</strong
    ><span>Click the edge item to restore this group.</span>
  </aside>
</template>

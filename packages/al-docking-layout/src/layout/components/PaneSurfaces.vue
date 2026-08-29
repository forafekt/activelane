<script setup lang="ts">
import { computed, inject } from 'vue'
import type { LayoutStore } from '../core/store'
import { surfaceMountRegistryKey } from '../core/surfaces'
import { groups as groupsIn } from '../core/tree'

const props = defineProps<{ store: LayoutStore }>()
const mounts = inject(surfaceMountRegistryKey)
if (!mounts) throw new Error('PaneSurfaces must be rendered inside LayoutRoot')

const allGroups = computed(() => {
  const groups = [
    ...groupsIn(props.store.state.root),
    ...props.store.state.hiddenGroups.map((entry) => entry.group),
    ...props.store.state.collapsed.map((entry) => entry.group),
  ]
  return [...new Map(groups.map((group) => [group.id, group])).values()]
})
</script>

<template>
  <div
    :ref="(element) => mounts.setRetention(element as HTMLElement | null)"
    class="pane-surface-retention"
    aria-hidden="true"
  />
  <div
    v-for="group in allGroups"
    :key="group.id"
    :ref="(element) => mounts.setMount(group.id, element as HTMLElement | null)"
    class="pane-surface-mount"
  >
    <component
      :is="store.registry.get(pane.type)?.component"
      v-for="pane in group.tabs"
      v-show="pane.id === group.activeTabId && !group.hiddenTabIds.includes(pane.id)"
      :key="pane.id"
      v-bind="pane.props"
      :active="pane.id === group.activeTabId && !group.hiddenTabIds.includes(pane.id)"
      :pane="pane"
      :group="group"
    />
  </div>
</template>

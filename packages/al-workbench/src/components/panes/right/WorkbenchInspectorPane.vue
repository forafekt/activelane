<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../../core/workbench/contributions'
import type { WorkbenchLayoutNode } from '../../../core/workbench/shell'

import InspectorPanel from './InspectorPanel.vue'

defineOptions({ name: 'WorkbenchInspectorPane' })

const runtime = useWorkbenchRuntime()

const X = runtime.workbench.ui.getIcon('X')

const [AlEmptyState, AlIconButton] = runtime.workbench.ui.getComponents([
  'AlEmptyState',
  'AlIconButton',
])

function findActiveTab(node: WorkbenchLayoutNode, activeGroupId: string): WorkbenchTab | null {
  if (node.kind === 'group') {
    if (node.id !== activeGroupId) return null
    return node.tabs.find((tab) => tab.id === node.activeTabId) ?? node.tabs[0] ?? null
  }
  for (const child of node.children) {
    const found = findActiveTab(child, activeGroupId)
    if (found) return found
  }
  return null
}

const activeTab = computed(() =>
  findActiveTab(runtime.workbench.state.layout, runtime.workbench.state.activeGroupId),
)

const panels = computed(() =>
  runtime.registry.inspectorPanels.filter((panel) =>
    activeTab.value
      ? !panel.tabKinds?.length || panel.tabKinds.includes(activeTab.value.kind)
      : false,
  ),
)
</script>

<template>
  <InspectorPanel
    :runtime="runtime"
    :title="activeTab?.title ?? 'Nothing selected'"
    class="wb-inspector-pane h-full min-h-0"
  >
    <template #actions>
      <AlIconButton
        label="Close inspector"
        :icon="X"
        variant="ghost"
        size="icon-sm"
        @click="runtime.workbench.setInspectorCollapsed(true)"
      />
    </template>

    <div class="wb-inspector-pane__content grid min-h-0 gap-3">
      <WorkbenchExtensionBoundary
        v-for="panel in panels"
        :key="panel.id"
        :component="panel.component"
        :extension-id="panel.ownerExtensionId"
        :extension-name="runtime.extensions.getRecord(panel.ownerExtensionId ?? '')?.manifest.displayName"
        :contribution-id="panel.id"
        surface="inspector"
        :pass-through="{ tab: activeTab, runtime }"
      />
      <AlEmptyState
        v-if="!panels.length"
        title="No inspector panels"
        description="Extensions can contribute constextual inspector surfaces for the active tab kind."
      />
    </div>
  </InspectorPanel>
</template>

<style scoped>
.wb-inspector-pane {
  background: var(--pane-surface);
}

.wb-inspector-pane__content {
  padding: 0.75rem;
}
</style>

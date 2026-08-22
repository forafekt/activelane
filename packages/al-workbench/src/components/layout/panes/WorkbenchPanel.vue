<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import IsolatedViewHost from '../../../views/IsolatedViewHost.vue'

defineOptions({ name: 'WorkbenchPanel' })

defineProps<{
  style: Record<string, string>
}>()

const runtime = useWorkbenchRuntime()

const [EmptyState, IconButton] = runtime.workbench.ui.getComponents(['EmptyState', 'IconButton'])

const views = computed(() => [...runtime.registry.bottomPaneViews])
const isolatedViews = computed(() =>
  runtime.registry.views.filter((view) =>
    runtime.registry.containers.some(
      (container) => container.id === view.container && container.location === 'panel',
    ),
  ),
)
const activeView = computed(() => {
  const activeViewId = runtime.workbench.state.bottomPanel.activeViewId
  return views.value.find((view) => view.id === activeViewId) ?? views.value[0] ?? null
})

function viewIcon(view: (typeof views.value)[number]) {
  if (!view.icon || typeof view.icon !== 'string') return view.icon
  try {
    return runtime.workbench.ui.getIcon(view.icon)
  } catch {
    return undefined
  }
}

function focusView(viewId: string) {
  runtime.workbench.setActiveBottomPanelView(viewId)
}

function closeBottomPane() {
  runtime.workbench.setBottomPanelOpen(false)
}

watch(
  views,
  (nextViews) => {
    const activeViewId = runtime.workbench.state.bottomPanel.activeViewId
    if (activeViewId && nextViews.some((view) => view.id === activeViewId)) return
    runtime.workbench.setActiveBottomPanelView(nextViews[0]?.id ?? null)
  },
  { immediate: true },
)
</script>
<template>
  <aside class="wb-shell__bottom-panel" :style="style">
    <div class="wb-shell__bottom-panel-header">
      <div class="wb-shell__bottom-panel-tabs" role="tablist" aria-label="Bottom pane views">
        <button
          v-for="view in views"
          :key="view.id"
          type="button"
          class="wb-shell__bottom-panel-tab"
          :class="{ 'wb-shell__bottom-panel-tab--active': activeView?.id === view.id }"
          role="tab"
          :aria-selected="activeView?.id === view.id"
          @click="focusView(view.id)"
        >
          <component :is="viewIcon(view)" v-if="viewIcon(view)" class="size-4" />
          <span>{{ view.title }}</span>
        </button>
        <div v-if="!views.length" class="wb-shell__bottom-panel-title"></div>
      </div>

      <div class="wb-shell__bottom-panel-actions">
        <IconButton
          label="Close bottom pane"
          :icon="runtime.workbench.ui.getIcon('lucide:x')"
          size="icon-xs"
          variant="ghost"
          @click="closeBottomPane"
        />
      </div>
    </div>
    <div v-if="activeView || isolatedViews[0]" class="wb-shell__bottom-panel-content">
      <IsolatedViewHost
        v-if="isolatedViews[0]"
        :definition="isolatedViews[0]"
        :instance-id="isolatedViews[0].id"
        class="h-full min-h-0"
      />
      <component
        v-else-if="activeView"
        :is="activeView.component"
        :key="activeView.id"
        :runtime="runtime"
        :view="activeView"
        class="h-full min-h-0"
      />
    </div>
    <div v-else class="min-h-0 p-3">
      <EmptyState
        title="No bottom pane view selected"
        description="Select a bottom pane view from the tabs above."
      />
    </div>
  </aside>
</template>

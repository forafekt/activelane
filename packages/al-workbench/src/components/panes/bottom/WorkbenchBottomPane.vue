<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchBottomPane' })

defineProps<{
  style: Record<string, string>
}>()

const runtime = useWorkbenchRuntime()

const [AlEmptyState, AlIconButton] = runtime.workbench.ui.getComponents([
  'AlEmptyState',
  'AlIconButton',
])

const views = computed(() => [...runtime.registry.bottomPaneViews])
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
        <AlIconButton
          label="Close bottom pane"
          :icon="runtime.workbench.ui.getIcon('X')"
          size="icon-xs"
          variant="ghost"
          @click="closeBottomPane"
        />
      </div>
    </div>
    <div v-if="activeView" class="wb-shell__bottom-panel-content">
      <component
        :is="activeView.component"
        :key="activeView.id"
        :runtime="runtime"
        :view="activeView"
        class="h-full min-h-0"
      />
    </div>
    <div v-else class="min-h-0 p-3">
      <AlEmptyState
        title="No bottom pane view selected"
        description="Select a bottom pane view from the tabs above."
      />
    </div>
  </aside>
</template>

<style scoped>
.wb-shell__bottom-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--pane-surface);
}

.wb-shell__bottom-panel-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-surface);
  backdrop-filter: blur(14px) saturate(1.06);
  min-height: 2.25rem;
}

.wb-shell__bottom-panel-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0.0625rem;
  padding: 0 0.25rem;
}

.wb-shell__bottom-panel-tabs {
  display: flex;
  min-width: 0;
  align-items: stretch;
  overflow-x: auto;
  gap: 0.25rem;
  padding: 0.25rem;
}

.wb-shell__bottom-panel-tab,
.wb-shell__bottom-panel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--muted-foreground);
}

.wb-shell__bottom-panel-tab {
  gap: 0.375rem;
  min-width: 6rem;
  max-width: 14rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}

.wb-shell__bottom-panel-tab:hover,
.wb-shell__bottom-panel-close:hover {
  background: var(--tab-hover);
  color: var(--text-primary);
}

.wb-shell__bottom-panel-tab--active {
  color: var(--foreground);
  background: var(--selected);
  box-shadow: inset 0 -2px 0 var(--ring);
}

.wb-shell__bottom-panel-title {
  padding: 0.5rem 0.75rem;
}

.wb-shell__bottom-panel-close {
  width: 2.25rem;
  border-right: 0;
  border-left: 1px solid var(--border);
}

.wb-shell__bottom-panel-content {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>

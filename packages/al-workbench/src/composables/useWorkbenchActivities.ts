import { computed } from 'vue'
import { useWorkbenchRuntime } from './useWorkbenchRuntime'

export function useWorkbenchActivities() {
  const runtime = useWorkbenchRuntime()

  const items = computed(() => {
    const order = runtime.workbench.state.layoutPreference.activityOrder
    const orderIndex = new Map(order.map((id, index) => [id, index]))
    return runtime.registry.activityRail.slice().sort((left, right) => {
      const leftIndex = orderIndex.get(left.id)
      const rightIndex = orderIndex.get(right.id)
      if (leftIndex != null || rightIndex != null) {
        return (leftIndex ?? Number.MAX_SAFE_INTEGER) - (rightIndex ?? Number.MAX_SAFE_INTEGER)
      }
      return (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title)
    })
  })

  function activate(activityId: string) {
    runtime.workbench.setActiveActivity(activityId)
    const sidebarView = runtime.registry.sidebarViews.find((item) => item.activityId === activityId)
    runtime.workbench.setActiveSidebarView(sidebarView?.id ?? null)
    runtime.workbench.setSidebarCollapsed(false)
    void runtime.workbench.persist()
  }

  function reorder(activityId: string, targetActivityId: string) {
    runtime.workbench.reorderActivity(activityId, targetActivityId)
    void runtime.workbench.persist()
  }

  return {
    items,
    activate,
    reorder,
  }
}

import type { WorkbenchTabContext } from '@activelane/workbench-api'
import {
  createTabContext,
  resolveGlobalMenuGroups,
  resolveTabContextMenu,
} from '../menus/menuResolution'
import { useWorkbenchRuntime } from './useWorkbenchRuntime'

export { createTabContext }

export function useWorkbenchMenus() {
  const runtime = useWorkbenchRuntime()

  function tabContextMenu(context: WorkbenchTabContext) {
    return resolveTabContextMenu(runtime.registry, context)
  }

  function globalMenuGroups(placement: 'topBar' | 'activityLauncher') {
    const activeTab = runtime.workbench.getActiveTab()
    return resolveGlobalMenuGroups(runtime.registry, placement, {
      platform: runtime.context.hostKind === 'desktop' ? 'desktop' : 'web',
      activeActivityId: runtime.workbench.state.activeActivityId,
      activeSidebarViewId: runtime.workbench.state.activeSidebarViewId,
      activeTabId: activeTab?.id,
      activeTabKind: activeTab?.kind,
      activeTabDirty: activeTab?.dirty,
      activeTabPinned: activeTab?.pinned,
      activeTabPreview: activeTab?.preview,
      filesAutoSave: runtime.settings.get<boolean>('files.autoSave', false),
    })
  }

  return {
    tabContextMenu,
    globalMenuGroups,
  }
}

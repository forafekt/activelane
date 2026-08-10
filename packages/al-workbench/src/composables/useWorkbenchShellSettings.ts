import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, watch } from 'vue'

export function useWorkbenchShellSettings(
  runtime: WorkbenchRuntimeApi,
  hostRef: Ref<HTMLElement | null>,
) {
  let settingsChangeDisposable: { dispose: () => void } | null = null

  function applyRuntimeSettings() {
    const theme = runtime.settings.get<string>('workbench.appearance.theme')
    if (theme && theme !== runtime.themes.getPreference()) void runtime.themes.setPreference(theme)

    const fontSize = runtime.settings.get<number>('workbench.appearance.fontSize') ?? 13
    const density = runtime.settings.get<string>('workbench.appearance.density') ?? 'compact'
    if (hostRef.value) {
      hostRef.value.style.setProperty('--font-size', `${fontSize}px`)
      hostRef.value.dataset.density = density
      hostRef.value.dataset.tabsVisible = String(
        runtime.settings.get<boolean>('workbench.layout.tabs.visible') !== false,
      )
      hostRef.value.dataset.tabsCompact = String(
        runtime.settings.get<boolean>('workbench.layout.tabs.compact') !== false,
      )
      hostRef.value.dataset.diagnostics = String(
        runtime.settings.get<boolean>('workbench.developer.showDiagnostics') === true,
      )
      hostRef.value.dataset.reducedMotion = String(
        runtime.settings.get<boolean>('workbench.appearance.reducedMotion') === true,
      )
      hostRef.value.dataset.notificationPosition =
        runtime.settings.get<string>('workbench.notifications.position') ?? 'bottom-right'
    }

    const collapsed = runtime.settings.get<boolean>('workbench.layout.sidebar.collapsed')
    if (typeof collapsed === 'boolean' && collapsed !== runtime.workbench.state.sidebar.collapsed) {
      runtime.workbench.setSidebarCollapsed(collapsed)
    }
    const sidebarWidth = runtime.settings.get<number>('workbench.layout.sidebar.width')
    if (
      typeof sidebarWidth === 'number' &&
      !runtime.workbench.state.sidebar.collapsed &&
      runtime.workbench.state.sidebar.size !== sidebarWidth
    ) {
      runtime.workbench.setSidebarSize(sidebarWidth)
    }
    const inspectorCollapsed = runtime.settings.get<boolean>('workbench.layout.inspector.collapsed')
    if (
      typeof inspectorCollapsed === 'boolean' &&
      inspectorCollapsed !== runtime.workbench.state.inspector.collapsed
    ) {
      runtime.workbench.setInspectorCollapsed(inspectorCollapsed)
    }
    const bottomPanelOpen = runtime.settings.get<boolean>('workbench.layout.bottomPanel.open')
    if (
      typeof bottomPanelOpen === 'boolean' &&
      bottomPanelOpen !== runtime.workbench.state.bottomPanel.open
    ) {
      runtime.workbench.setBottomPanelOpen(bottomPanelOpen)
    }
    const activityRailLocation = runtime.settings.get<'left' | 'right' | 'top'>(
      'workbench.layout.activityRail.location',
    )
    if (activityRailLocation) runtime.workbench.setActivityRailLocation(activityRailLocation)
    const commandBarVisible = runtime.settings.get<boolean>('workbench.layout.commandBar.visible')
    if (typeof commandBarVisible === 'boolean')
      runtime.workbench.setCommandBarVisible(commandBarVisible)
    const commandBarLocation = runtime.settings.get<'workbench-top' | 'titlebar'>(
      'workbench.layout.commandBar.location',
    )
    if (commandBarLocation) runtime.workbench.setCommandBarLocation(commandBarLocation)
  }

  onMounted(() => {
    settingsChangeDisposable = runtime.settings.onDidChange(() => applyRuntimeSettings())
    applyRuntimeSettings()
  })

  onBeforeUnmount(() => {
    settingsChangeDisposable?.dispose()
  })

  watch(
    () => runtime.themes.getPreference(),
    (preference) => {
      const current = runtime.settings.get<string>('workbench.appearance.theme')
      if (preference && current !== preference) {
        void runtime.settings.set('workbench.appearance.theme', preference)
      }
    },
  )

  return {
    applyRuntimeSettings,
  }
}

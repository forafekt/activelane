import { defineWorkbenchExtension } from '@activelane/workbench/extensions'
import ApiStudioInspector from './components/ApiStudioInspector.vue'
import ApiStudioRequestEditor from './components/ApiStudioRequestEditor.vue'
import ApiStudioRequestLog from './components/ApiStudioRequestLog.vue'
import ApiStudioSidebar from './components/ApiStudioSidebar.vue'
import { provideApiStudioStore } from './runtime'
import { ApiStudioStore } from './store'

const EXTENSION_ID = '@activelane/api-studio'
const ACTIVITY_ID = 'api-studio.activity'
const SIDEBAR_ID = 'api-studio.sidebar'

export function createApiStudioExtension() {
  return defineWorkbenchExtension({
    manifest: {
      id: EXTENSION_ID,
      name: 'api-studio',
      displayName: 'ActiveLane API Studio',
      version: '0.3.3',
      description: 'Build, organize, send, and inspect HTTP APIs inside ActiveLane.',
      activationEvents: ['onStartup', 'onCommand', 'onView'],
    },
    async activate(context) {
      const studio = new ApiStudioStore(context)
      await studio.load()
      provideApiStudioStore(studio)

      const openStudio = () => {
        context.workbench.setActiveActivity(ACTIVITY_ID)
        context.workbench.setActiveSidebarView(SIDEBAR_ID)
        context.workbench.setSidebarCollapsed(false)
      }
      const openMarketplace = () => {
        context.workbench.setActiveActivity('extensions.marketplace.activity')
        context.workbench.setActiveSidebarView('extensions.marketplace.sidebar')
        context.workbench.openTab({ id: `extensions.marketplace.details.${EXTENSION_ID}`, kind: 'extensions.marketplace.details', surfaceId: 'extensions.marketplace.details.surface', title: 'API Studio', ownerExtensionId: 'activelane.extensions-marketplace', input: { surface: 'details', extensionId: EXTENSION_ID }, preview: false })
      }
      const selectedRequest = () => studio.selectedRequestId ?? context.workbench.getActiveTab()?.input?.requestId as string | undefined

      const contributions = [
        context.contribute.activityRail({ id: ACTIVITY_ID, title: 'API Studio', icon: 'Globe2', defaultSidebarViewId: SIDEBAR_ID, order: 35 }),
        context.contribute.sidebarViews({ id: SIDEBAR_ID, title: 'API Studio', activityId: ACTIVITY_ID, component: ApiStudioSidebar, actions: [
          { id: 'api-studio.sidebar.new-request', title: 'New Request', icon: 'Plus', commandId: 'api-studio.new-request' },
          { id: 'api-studio.sidebar.new-collection', title: 'New Collection', icon: 'FolderPlus', commandId: 'api-studio.new-collection' },
        ] }),
        context.contribute.tabRenderers({ id: 'api-studio.request-editor', title: 'API Studio Request Editor', tabKind: 'api-studio.request', component: ApiStudioRequestEditor }),
        context.contribute.inspectorPanels({ id: 'api-studio.request-inspector', title: 'Request Inspector', component: ApiStudioInspector, tabKinds: ['api-studio.request'] }),
        context.contribute.bottomPaneViews({ id: 'api-studio.request-log', title: 'Request Log', icon: 'ListRestart', component: ApiStudioRequestLog, placement: 'bottomPane' }),
        context.contribute.statusBar(
          { id: 'api-studio.status', title: 'API Studio', label: 'API Studio', icon: 'Globe2', commandId: 'api-studio.open', alignment: 'left', order: 40 },
          { id: 'api-studio.environment', title: 'Active API Studio environment', label: studio.activeEnvironment()?.name ?? 'No environment', icon: 'CircleDot', commandId: 'api-studio.select-environment', alignment: 'left', order: 41 },
          { id: 'api-studio.plan', title: 'API Studio plan', label: context.entitlements.plan() === 'free' ? 'Free' : 'Pro ●', commandId: 'api-studio.open-marketplace', alignment: 'right', order: 40 },
        ),
        context.contribute.commands(
          { id: 'api-studio.open', title: 'API Studio: Open', category: 'API Studio', run: openStudio },
          { id: 'api-studio.new-request', title: 'API Studio: New Request', category: 'API Studio', shortcut: 'Mod+Alt+N', run: async () => { openStudio(); await studio.newRequest() } },
          { id: 'api-studio.new-collection', title: 'API Studio: New Collection', category: 'API Studio', run: async () => { openStudio(); await studio.newCollection() } },
          { id: 'api-studio.send-request', title: 'API Studio: Send Request', category: 'API Studio', shortcut: 'Mod+Enter', run: async () => { const id = selectedRequest(); if (id) await studio.send(id) } },
          { id: 'api-studio.save-request', title: 'API Studio: Save Request', category: 'API Studio', shortcut: 'Mod+S', run: () => studio.save() },
          { id: 'api-studio.duplicate-request', title: 'API Studio: Duplicate Request', category: 'API Studio', run: async () => { const id = selectedRequest(); if (id) await studio.duplicateRequest(id) } },
          { id: 'api-studio.select-environment', title: 'API Studio: Select Environment', category: 'API Studio', run: async () => { const environments = studio.state.environments; const current = Math.max(0, environments.findIndex((item) => item.id === studio.state.activeEnvironmentId)); const next = environments[(current + 1) % environments.length]; if (next) await studio.selectEnvironment(next.id) } },
          { id: 'api-studio.clear-history', title: 'API Studio: Clear Request History', category: 'API Studio', run: () => studio.clearHistory() },
          { id: 'api-studio.open-marketplace', title: 'API Studio: Open Marketplace Details', category: 'API Studio', run: openMarketplace },
          { id: 'api-studio.toggle-log', title: 'API Studio: Toggle Request Log', category: 'API Studio', run: () => { context.workbench.setActiveBottomPanelView('api-studio.request-log'); context.workbench.setBottomPanelOpen(true) } },
        ),
        context.contribute.commandPalette(
          ...['open','new-request','new-collection','send-request','save-request','duplicate-request','select-environment','clear-history','open-marketplace','toggle-log'].map((name, index) => ({ id: `api-studio.palette.${name}`, title: `API Studio: ${name.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')}`, commandId: `api-studio.${name}`, category: 'API Studio', order: 100 + index, keywords: ['api', 'http', 'request'] })),
        ),
        context.contribute.menus(
          { id: 'api-studio.menu.new-request', title: 'New Request', location: 'sidebar/context', commandId: 'api-studio.new-request', group: 'api-studio.create' },
          { id: 'api-studio.menu.new-collection', title: 'New Collection', location: 'sidebar/context', commandId: 'api-studio.new-collection', group: 'api-studio.create' },
          { id: 'api-studio.menu.send', title: 'Send Request', location: 'tab/toolbar', commandId: 'api-studio.send-request', icon: 'Send', contexts: { tabKinds: ['api-studio.request'] } },
          { id: 'api-studio.menu.save', title: 'Save Request', location: 'tab/toolbar', commandId: 'api-studio.save-request', icon: 'Save', contexts: { tabKinds: ['api-studio.request'] } },
          { id: 'api-studio.menu.duplicate', title: 'Duplicate Request', location: 'tab/context', commandId: 'api-studio.duplicate-request', contexts: { tabKinds: ['api-studio.request'] } },
          { id: 'api-studio.menu.log', title: 'Show Request Log', location: 'global/activity', commandId: 'api-studio.toggle-log', group: 'api-studio.views' },
        ),
      ]

      return { dispose: () => contributions.forEach((item) => item.dispose()) }
    },
  })
}

export default createApiStudioExtension()

import { getIcons } from '@activelane/icons'
import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type {
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
} from '../core/extensions/types'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import type { WorkbenchCommandExecutionContext } from '../core/workbench/contributions'

import ActivityIcon from './components/ActivityIcon.vue'
import MarketplaceExtensionDetailsView from './components/MarketplaceExtensionDetailsView.vue'
import MarketplaceInspectorPanel from './components/MarketplaceInspectorPanel.vue'
import MarketplaceSidebarView from './components/MarketplaceSidebarView.vue'
import MarketplaceTabView from './components/MarketplaceTabView.vue'

const [Check, Layers3, Search, Settings2, X] = getIcons([
  'Check',
  'Layers3',
  'Search',
  'Settings2',
  'X',
])

const MARKETPLACE_TAB_KIND = 'extensions.marketplace.home'
const MARKETPLACE_DETAILS_TAB_KIND = 'extensions.marketplace.details'
const MARKETPLACE_SURFACE_ID = 'extensions.marketplace.surface'
const MARKETPLACE_DETAILS_SURFACE_ID = 'extensions.marketplace.details.surface'

function openMarketplace(
  runtime: WorkbenchRuntimeApi,
  input?: {
    surface?: 'marketplace' | 'details' | 'settings'
    extensionId?: string
    filter?: string
    query?: string
  },
) {
  if (runtime.settings.get<boolean>('extensions.marketplace.enabled') === false) {
    void runtime.host.capabilities.notify?.({
      title: 'Marketplace disabled',
      message: 'Enable extensions.marketplace.enabled in Settings to browse extensions.',
      tone: 'warning',
    })
    return
  }
  const isDetails = input?.surface === 'details'
  runtime.workbench.setActiveActivity('extensions.marketplace.activity')
  runtime.workbench.setActiveSidebarView('extensions.marketplace.sidebar')
  runtime.workbench.openTab({
    id:
      isDetails && input?.extensionId
        ? `extensions.marketplace.details.${input.extensionId}`
        : 'extensions.marketplace',
    kind: isDetails ? MARKETPLACE_DETAILS_TAB_KIND : MARKETPLACE_TAB_KIND,
    surfaceId: isDetails ? MARKETPLACE_DETAILS_SURFACE_ID : MARKETPLACE_SURFACE_ID,
    title: isDetails ? 'Extension Details' : 'Extensions Marketplace',
    ownerExtensionId: 'activelane.extensions-marketplace',
    pinned: !isDetails,
    preview: false,
    icon: isDetails ? Layers3 : ActivityIcon,
    input: {
      surface: isDetails ? 'details' : 'marketplace',
      extensionId: input?.extensionId,
      filter: input?.filter,
      query: input?.query,
    },
  })
}

export function createExtensionsMarketplaceExtension(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.extensions-marketplace',
      name: 'extensions-marketplace',
      displayName: 'Extensions Marketplace',
      version: '0.1.0',
      description: 'Browse, install, enable, disable, and inspect ActiveLane workbench extensions.',
      builtin: true,
      categories: ['Platform', 'Extensions'],
      keywords: ['extensions', 'marketplace', 'plugins'],
      activationEvents: ['onStartup'],
      contributes: {
        apps: [
          {
            id: 'extensions.marketplace.app',
            title: 'Extensions Marketplace',
            name: 'Marketplace',
            description: 'Browse, install, enable, disable, and inspect ActiveLane extensions.',
            category: 'Extensions',
            icon: 'marketplace',
            keywords: ['extensions', 'marketplace', 'plugins', 'install'],
            launch: {
              type: 'command',
              commandId: 'extensions.marketplace.open',
            },
            order: 20,
          },
        ],
        activityRail: [
          {
            id: 'extensions.marketplace.activity',
            title: 'Extensions',
            icon: ActivityIcon,
            badge: { value: '' },
            defaultSidebarViewId: 'extensions.marketplace.sidebar',
            order: 20,
          },
        ],
        sidebarViews: [
          {
            id: 'extensions.marketplace.sidebar',
            activityId: 'extensions.marketplace.activity',
            title: 'Marketplace',
            component: MarketplaceSidebarView,
            actions: [
              {
                id: 'extensions.marketplace.open',
                title: 'Open marketplace',
                icon: Search,
                commandId: 'extensions.marketplace.open',
              },
            ],
          },
        ],
        commands: [
          {
            id: 'extensions.marketplace.open',
            title: 'Open Extensions Marketplace',
            icon: ActivityIcon,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime)
            },
          },
          {
            id: 'extensions.marketplace.open-settings',
            title: 'Open Extension Settings Contributions',
            icon: Settings2,
            run(context: WorkbenchCommandExecutionContext) {
              context.workbench.openTab({
                id: 'workbench.settings',
                kind: 'workbench.settings',
                title: 'Settings',
                preview: false,
                icon: Settings2,
                input: { category: 'Extensions', extensionSettings: true },
              })
            },
          },
          {
            id: 'extensions.marketplace.show-installed',
            title: 'Show Installed Extensions',
            icon: Layers3,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace', filter: 'installed' })
            },
          },
          {
            id: 'extensions.marketplace.show-available',
            title: 'Show Available Extensions',
            icon: ActivityIcon,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace', filter: 'available' })
            },
          },
          {
            id: 'extensions.marketplace.search',
            title: 'Search Extensions',
            icon: Search,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace' })
              context.workbench.setCommandPaletteOpen(false)
            },
          },
          {
            id: 'extensions.marketplace.manage',
            title: 'Manage Extension',
            icon: Settings2,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace', filter: 'installed' })
            },
          },
          {
            id: 'extensions.marketplace.enable',
            title: 'Enable Extension',
            icon: Check,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace', filter: 'disabled' })
            },
          },
          {
            id: 'extensions.marketplace.disable',
            title: 'Disable Extension',
            icon: X,
            run(context: WorkbenchCommandExecutionContext) {
              openMarketplace(context.runtime, { surface: 'marketplace', filter: 'enabled' })
            },
          },
        ],
        commandPalette: [
          {
            id: 'extensions.marketplace.command',
            title: 'Extensions: Open Marketplace',
            commandId: 'extensions.marketplace.open',
            icon: ActivityIcon,
            keywords: ['extensions', 'marketplace', 'plugins'],
            category: 'Extensions',
            description: 'Browse installed and available extensions.',
          },
          {
            id: 'extensions.marketplace.settings.command',
            title: 'Extensions: Open Settings Contributions',
            commandId: 'extensions.marketplace.open-settings',
            icon: Settings2,
            keywords: ['extensions', 'settings'],
            category: 'Extensions',
            description: 'Open extension settings contributions in a tab.',
          },
          {
            id: 'extensions.marketplace.installed.command',
            title: 'Extensions: Show Installed Extensions',
            commandId: 'extensions.marketplace.show-installed',
            icon: Layers3,
            keywords: ['extensions', 'installed', 'manage'],
            category: 'Extensions',
            description: 'Show all installed extensions in the marketplace.',
          },
          {
            id: 'extensions.marketplace.available.command',
            title: 'Extensions: Show Available Extensions',
            commandId: 'extensions.marketplace.show-available',
            icon: ActivityIcon,
            keywords: ['extensions', 'available', 'browse'],
            category: 'Extensions',
            description: 'Browse available extensions to install.',
          },
          {
            id: 'extensions.marketplace.search.command',
            title: 'Extensions: Search Extensions',
            commandId: 'extensions.marketplace.search',
            icon: Search,
            keywords: ['extensions', 'search', 'find', 'catalog'],
            category: 'Extensions',
            description: 'Open the marketplace search and filter surface.',
          },
          {
            id: 'extensions.marketplace.manage.command',
            title: 'Extensions: Manage Extension',
            commandId: 'extensions.marketplace.manage',
            icon: Settings2,
            keywords: ['extensions', 'manage', 'details', 'settings'],
            category: 'Extensions',
            description: 'Open installed extensions for management.',
          },
          {
            id: 'extensions.marketplace.enable.command',
            title: 'Extensions: Enable Extension',
            commandId: 'extensions.marketplace.enable',
            icon: Check,
            keywords: ['extensions', 'enable', 'activate'],
            category: 'Extensions',
            description: 'Enable an installed extension.',
          },
          {
            id: 'extensions.marketplace.disable.command',
            title: 'Extensions: Disable Extension',
            commandId: 'extensions.marketplace.disable',
            icon: X,
            keywords: ['extensions', 'disable', 'deactivate'],
            category: 'Extensions',
            description: 'Disable an installed extension.',
          },
        ],
        tabSurfaces: [
          {
            id: MARKETPLACE_SURFACE_ID,
            title: 'Extensions Marketplace',
            tabKind: MARKETPLACE_TAB_KIND,
            mode: 'native-vue',
            component: MarketplaceTabView,
          },
          {
            id: MARKETPLACE_DETAILS_SURFACE_ID,
            title: 'Extension Details',
            tabKind: MARKETPLACE_DETAILS_TAB_KIND,
            mode: 'native-vue',
            component: MarketplaceExtensionDetailsView,
          },
        ],
        tabToolbarActions: [
          {
            id: 'extensions.marketplace.toolbar.open',
            title: 'Marketplace',
            icon: Layers3,
            commandId: 'extensions.marketplace.open',
            when: MARKETPLACE_TAB_KIND,
          },
        ],
        tabContextMenu: [
          {
            id: 'extensions.marketplace.context.open',
            title: 'Reopen Marketplace',
            location: 'tab/context',
            commandId: 'extensions.marketplace.open',
            when: MARKETPLACE_TAB_KIND,
          },
        ],
        inspectorPanels: [
          {
            id: 'extensions.marketplace.inspector',
            title: 'Extension Runtime Status',
            component: MarketplaceInspectorPanel,
            tabKinds: [MARKETPLACE_TAB_KIND, MARKETPLACE_DETAILS_TAB_KIND],
          },
        ],
        settingsPages: [
          {
            id: 'extensions.marketplace.settings',
            title: 'Extensions',
            component: MarketplaceTabView,
            icon: Layers3,
            section: 'Extensions',
          },
        ],
        settings: [
          {
            id: 'extensions.marketplace.enabled',
            label: 'Marketplace Enabled',
            description: 'Enables marketplace discovery and install surfaces.',
            category: 'Marketplace',
            type: 'boolean',
            defaultValue: true,
            tags: ['extensions', 'marketplace'],
          },
          {
            id: 'extensions.marketplace.showRecommendations',
            label: 'Show Marketplace Recommendations',
            description: 'Shows recommended extension sections in marketplace surfaces.',
            category: 'Marketplace',
            type: 'boolean',
            defaultValue: true,
            tags: ['extensions', 'marketplace', 'recommended'],
          },
          {
            id: 'extensions.marketplace.defaultSort',
            label: 'Default Marketplace Sort',
            description: 'Controls the initial sort order used by marketplace search.',
            category: 'Marketplace',
            type: 'enum',
            defaultValue: 'recommended',
            options: [
              { label: 'Recommended', value: 'recommended' },
              { label: 'Name', value: 'name' },
              { label: 'Recently Updated', value: 'updated' },
              { label: 'Downloads', value: 'downloads' },
              { label: 'Rating', value: 'rating' },
            ],
            tags: ['extensions', 'marketplace', 'sort'],
          },
        ],
        marketplace: {
          categories: ['Platform'],
          featured: true,
          keywords: ['extensions', 'platform'],
          longDescription:
            'First-party marketplace proving that the workbench is extension-driven.',
        },
      },
    },
    activate(_context: WorkbenchExtensionContext) {
      return undefined
    },
  })
}

export default createExtensionsMarketplaceExtension

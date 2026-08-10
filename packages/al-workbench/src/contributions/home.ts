import { getIcon } from '@activelane/icons'
import type {
  OpenWorkbenchTabOptions,
  WorkbenchCommandExecutionContext,
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
  WorkbenchRuntimeApi,
} from '@activelane/workbench-api'
import { defineWorkbenchExtension } from '@activelane/workbench-api'
import HomeSidebarView from '../views/home/HomeSidebarView.vue'
import HomeTabView from '../views/home/HomeTabView.vue'

export const WORKBENCH_HOME_TAB_KIND = 'home.welcome'

export function openWorkbenchHome(
  runtime: WorkbenchRuntimeApi,
  overrides: Partial<OpenWorkbenchTabOptions> = {},
) {
  runtime.workbench.openTab({
    id: overrides.id ?? 'home.welcome',
    kind: WORKBENCH_HOME_TAB_KIND,
    title: overrides.title ?? 'Welcome',
    ownerExtensionId: 'activelane.home',
    pinned: overrides.pinned ?? true,
    preview: overrides.preview ?? false,
    icon: getIcon('Home'),
    input: overrides.input ?? { source: 'workbench' },
  })
}

export function createWorkbenchHomeContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.home',
      name: 'home',
      displayName: 'Home',
      version: '0.1.0',
      description: 'Landing surface for the ActiveLane workbench.',
      builtin: true,
      categories: ['Navigation'],
      activationEvents: ['onStartup'],
      contributes: {
        apps: [
          {
            id: 'home.app',
            title: 'Home',
            name: 'Home',
            description: 'Open the ActiveLane home and welcome surface.',
            category: 'Navigation',
            icon: 'home',
            keywords: ['welcome', 'start', 'home'],
            launch: {
              type: 'command',
              commandId: 'home.open.welcome',
            },
            order: 0,
          },
        ],
        activityRail: [
          {
            id: 'home.activity',
            title: 'Home',
            icon: getIcon('Home'),
            defaultSidebarViewId: 'home.sidebar',
            order: 0,
          },
        ],
        sidebarViews: [
          {
            id: 'home.sidebar',
            activityId: 'home.activity',
            title: 'Home',
            component: HomeSidebarView,
          },
        ],
        commands: [
          {
            id: 'home.open.welcome',
            title: 'Home: Open Welcome',
            icon: getIcon('Sparkles'),
            run(context: WorkbenchCommandExecutionContext) {
              openWorkbenchHome(context.runtime)
            },
          },
        ],
        commandPalette: [
          {
            id: 'home.command.open',
            title: 'Home: Open Welcome',
            commandId: 'home.open.welcome',
            icon: getIcon('Sparkles'),
            keywords: ['welcome', 'start', 'home'],
            category: 'Home',
            description: 'Open the landing tab for the ActiveLane workbench.',
          },
        ],
        tabRenderers: [
          {
            id: 'home.renderer',
            title: 'Home Renderer',
            tabKind: WORKBENCH_HOME_TAB_KIND,
            component: HomeTabView,
          },
        ],
      },
    },
    activate(context: WorkbenchExtensionContext) {
      if (!context.workbench.getActiveTab()) openWorkbenchHome(context.runtime)
      return undefined
    },
  })
}

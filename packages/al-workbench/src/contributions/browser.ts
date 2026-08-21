import { getIcon } from '@activelane/icons'
import {
  browserSettings,
  createBrowserCommandPalette,
  createBrowserCommands,
  createBrowserTabRenderer,
} from '../browser'
import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type { WorkbenchExtensionDefinition } from '../core/extensions/types'

export function createWorkbenchBrowserContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.workbench-browser',
      name: 'workbench-browser',
      displayName: 'Workbench Browser',
      version: '0.1.0',
      description: 'Integrated browser surface for ActiveLane workbench tabs.',
      builtin: true,
      categories: ['Workbench'],
      keywords: ['browser', 'preview', 'localhost', 'web'],
      activationEvents: ['onStartup'],
      contributes: {
        settings: browserSettings,
        commands: createBrowserCommands(),
        commandPalette: createBrowserCommandPalette(),
        tabRenderers: [createBrowserTabRenderer()],
        tabToolbarActions: [
          {
            id: 'workbench.browser.toolbar.newTab',
            title: 'New Browser Tab',
            icon: getIcon('lucide:plus'),
            commandId: 'workbench.browser.newTab',
            when: 'browser',
            order: 5,
          },
          {
            id: 'workbench.browser.toolbar.reload',
            title: 'Reload Browser',
            icon: getIcon('lucide:rotate-ccw'),
            commandId: 'workbench.browser.reload',
            when: 'browser',
            order: 10,
          },
          {
            id: 'workbench.browser.toolbar.stop',
            title: 'Stop Loading',
            icon: getIcon('lucide:x'),
            commandId: 'workbench.browser.stop',
            when: 'browser',
            order: 11,
          },
          {
            id: 'workbench.browser.toolbar.external',
            title: 'Open Browser Externally',
            icon: getIcon('lucide:external-link'),
            commandId: 'workbench.browser.openExternal',
            when: 'browser',
            order: 20,
          },
        ],
        tabContextMenu: [
          {
            id: 'workbench.browser.context.duplicate',
            title: 'Duplicate Browser Tab',
            location: 'tab/context',
            commandId: 'workbench.browser.duplicate',
            icon: getIcon('lucide:copy'),
            contexts: { tabKinds: ['browser'] },
            order: 25,
          },
          {
            id: 'workbench.browser.context.home',
            title: 'Go Home',
            location: 'tab/context',
            commandId: 'workbench.browser.home',
            icon: getIcon('lucide:house'),
            contexts: { tabKinds: ['browser'] },
            order: 24,
          },
          {
            id: 'workbench.browser.context.external',
            title: 'Open Browser Externally',
            location: 'tab/context',
            commandId: 'workbench.browser.openExternal',
            icon: getIcon('lucide:external-link'),
            contexts: { tabKinds: ['browser'] },
            order: 26,
          },
        ],
        menus: [
          {
            id: 'workbench.menu.view.browser.openUrl',
            title: 'Open Browser URL',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.browser.openUrl',
            icon: getIcon('lucide:globe'),
            order: 35,
          },
          {
            id: 'workbench.menu.view.browser.newTab',
            title: 'New Browser Tab',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.browser.newTab',
            icon: getIcon('lucide:plus'),
            shortcut: 'Mod+T',
            order: 34,
          },
          {
            id: 'workbench.menu.view.browser.openLocalhost',
            title: 'Open Localhost Browser',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.browser.openLocalhost',
            icon: getIcon('lucide:globe'),
            order: 36,
          },
        ],
      },
    },
  })
}

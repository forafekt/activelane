import { getIcon } from '@activelane/icons'
import type { WorkbenchExtensionDefinition } from '@activelane/workbench-api'
import { defineWorkbenchExtension } from '@activelane/workbench-api'
import {
  browserSettings,
  createBrowserCommandPalette,
  createBrowserCommands,
  createBrowserTabRenderer,
} from '../browser'

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
            icon: getIcon('Plus'),
            commandId: 'workbench.browser.newTab',
            when: 'browser',
            order: 5,
          },
          {
            id: 'workbench.browser.toolbar.reload',
            title: 'Reload Browser',
            icon: getIcon('RotateCcw'),
            commandId: 'workbench.browser.reload',
            when: 'browser',
            order: 10,
          },
          {
            id: 'workbench.browser.toolbar.stop',
            title: 'Stop Loading',
            icon: getIcon('X'),
            commandId: 'workbench.browser.stop',
            when: 'browser',
            order: 11,
          },
          {
            id: 'workbench.browser.toolbar.external',
            title: 'Open Browser Externally',
            icon: getIcon('ExternalLink'),
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
            icon: getIcon('Copy'),
            contexts: { tabKinds: ['browser'] },
            order: 25,
          },
          {
            id: 'workbench.browser.context.home',
            title: 'Go Home',
            location: 'tab/context',
            commandId: 'workbench.browser.home',
            icon: getIcon('House'),
            contexts: { tabKinds: ['browser'] },
            order: 24,
          },
          {
            id: 'workbench.browser.context.external',
            title: 'Open Browser Externally',
            location: 'tab/context',
            commandId: 'workbench.browser.openExternal',
            icon: getIcon('ExternalLink'),
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
            icon: getIcon('Globe'),
            order: 35,
          },
          {
            id: 'workbench.menu.view.browser.newTab',
            title: 'New Browser Tab',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.browser.newTab',
            icon: getIcon('Plus'),
            shortcut: 'Mod+T',
            order: 34,
          },
          {
            id: 'workbench.menu.view.browser.openLocalhost',
            title: 'Open Localhost Browser',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.browser.openLocalhost',
            icon: getIcon('Globe'),
            order: 36,
          },
        ],
      },
    },
  })
}

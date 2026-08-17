import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type { WorkbenchExtensionDefinition } from '../core/extensions/types'
import type { MaybePromise } from '../core/shared/types'
import type { WorkbenchCommandExecutionContext } from '../core/workbench/contributions'

import { builtinWorkbenchSettings } from '../settings/defaults'

function workbenchCommand(
  id: string,
  title: string,
  run: (context: WorkbenchCommandExecutionContext) => MaybePromise<void>,
  shortcut?: string,
  secondaryShortcuts?: string[],
) {
  return {
    id,
    title,
    category: 'Workbench',
    shortcut,
    secondaryShortcuts,
    run,
  }
}

function openTabWorkspaceDialog(mode: string) {
  window.dispatchEvent(new CustomEvent('activelane:tab-workspace-dialog', { detail: { mode } }))
}

export function createWorkbenchCoreContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.workbench-core',
      name: 'workbench-core',
      displayName: 'Workbench Core',
      version: '0.1.0',
      description: 'Core shell commands for the ActiveLane workbench.',
      builtin: true,
      activationEvents: ['onStartup'],
      contributes: {
        settings: builtinWorkbenchSettings,
        statusBar: [
          {
            id: 'workbench.status.launchpad',
            title: 'Launchpad',
            label: 'Launchpad',
            icon: 'lucide.house',
            commandId: 'workbench.launcher.showApps',
            alignment: 'left',
            order: 10,
          },
          {
            id: 'workbench.status.notifications',
            title: 'Notifications',
            label: '',
            icon: 'lucide.bell',
            alignment: 'right',
            order: 10,
          },
        ],
        apps: [
          {
            id: 'workbench.settings.app',
            title: 'Settings',
            name: 'Settings',
            description: 'Configure ActiveLane workbench preferences, keybindings, and extensions.',
            category: 'System',
            icon: 'lucide.settings',
            keywords: ['preferences', 'settings', 'configuration', 'keybindings'],
            launch: {
              type: 'command',
              commandId: 'workbench.settings.open',
            },
            order: 10,
          },
        ],
        globalMenus: [
          { id: 'workbench.menu.file', menuId: 'file', title: 'File', order: 10 },
          { id: 'workbench.menu.edit', menuId: 'edit', title: 'Edit', order: 20 },
          { id: 'workbench.menu.selection', menuId: 'selection', title: 'Selection', order: 30 },
          { id: 'workbench.menu.view', menuId: 'view', title: 'View', order: 40 },
          { id: 'workbench.menu.go', menuId: 'go', title: 'Go', order: 50 },
          { id: 'workbench.menu.run', menuId: 'run', title: 'Run', order: 60 },
          { id: 'workbench.menu.terminal', menuId: 'terminal', title: 'Terminal', order: 70 },
          { id: 'workbench.menu.window', menuId: 'window', title: 'Window', order: 80 },
          { id: 'workbench.menu.help', menuId: 'help', title: 'Help', order: 90 },
        ],
        commands: [
          workbenchCommand(
            'workbench.commandPalette.open',
            'Workbench: Open Command Palette',
            ({ workbench }) => workbench.setCommandPaletteOpen(true),
            'Mod+K',
            ['Mod+Shift+P'],
          ),
          workbenchCommand(
            'workbench.sidebar.toggle',
            'Workbench: Toggle Sidebar',
            ({ workbench }) => workbench.setSidebarCollapsed(!workbench.state.sidebar.collapsed),
            'Mod+B',
          ),
          workbenchCommand(
            'workbench.inspector.toggle',
            'Workbench: Toggle Inspector',
            ({ workbench }) =>
              workbench.setInspectorCollapsed(!workbench.state.inspector.collapsed),
            'Mod+Alt+I',
          ),
          workbenchCommand(
            'workbench.split.right',
            'Workbench: Split Active Tab Right',
            ({ workbench }) => {
              workbench.splitActiveTabRight()
            },
            'Mod+Alt+Right',
          ),
          workbenchCommand(
            'workbench.split.down',
            'Workbench: Split Active Tab Down',
            ({ workbench }) => {
              workbench.splitActiveTabDown()
            },
            'Mod+Alt+Down',
          ),
          workbenchCommand(
            'workbench.group.next',
            'Workbench: Focus Next Group',
            ({ workbench }) => {
              workbench.focusNextGroup()
            },
          ),
          workbenchCommand(
            'workbench.group.previous',
            'Workbench: Focus Previous Group',
            ({ workbench }) => {
              workbench.focusPreviousGroup()
            },
          ),
          workbenchCommand(
            'workbench.tab.close',
            'Workbench: Close Active Tab',
            ({ workbench }) => {
              workbench.closeActiveTab()
            },
            'Mod+W',
          ),
          workbenchCommand(
            'workbench.tab.duplicate',
            'Workbench: Duplicate Active Tab',
            ({ workbench }) => {
              const tab = workbench.getActiveTab()
              if (tab) workbench.duplicateTab(tab.id, tab.groupId)
            },
          ),
          workbenchCommand(
            'workbench.tab.reopenClosed',
            'Workbench: Reopen Closed Tab',
            ({ workbench }) => {
              workbench.reopenClosedTab()
            },
          ),
          workbenchCommand(
            'workbench.tab.toggleLock',
            'Workbench: Lock or Unlock Active Tab',
            ({ workbench }) => {
              const tab = workbench.getActiveTab()
              if (tab) workbench.setTabLocked(tab.id, !tab.locked, tab.groupId)
            },
          ),
          workbenchCommand(
            'workbench.tab.togglePinned',
            'Workbench: Pin or Unpin Active Tab',
            ({ workbench }) => {
              const tab = workbench.getActiveTab()
              if (tab) workbench.setTabPinned(tab.id, !tab.pinned, tab.groupId)
            },
          ),
          workbenchCommand(
            'workbench.tabs.sessions.save',
            'Tabs: Save Current Session',
            async ({ runtime }) => {
              const session = await runtime.workbench.tabs.sessions.saveCurrent('Saved Session')
              await runtime.host.capabilities.notify?.({
                title: 'Session saved',
                message: session.name,
                tone: 'info',
              })
            },
          ),
          workbenchCommand('workbench.tabs.sessions.manage', 'Tabs: Restore Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand(
            'workbench.tabs.sessions.saveAs',
            'Tabs: Save Current Session As...',
            () => openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand('workbench.tabs.sessions.rename', 'Tabs: Rename Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand('workbench.tabs.sessions.duplicate', 'Tabs: Duplicate Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand('workbench.tabs.sessions.delete', 'Tabs: Delete Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand('workbench.tabs.sessions.export', 'Tabs: Export Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand('workbench.tabs.sessions.import', 'Tabs: Import Session', () =>
            openTabWorkspaceDialog('sessions'),
          ),
          workbenchCommand(
            'workbench.tabs.templates.create',
            'Tabs: Create Tab Template from Current Workspace',
            async ({ runtime }) => {
              const template =
                await runtime.workbench.tabs.templates.saveCurrent('Workspace Template')
              await runtime.host.capabilities.notify?.({
                title: 'Template created',
                message: template.name,
                tone: 'info',
              })
            },
          ),
          workbenchCommand('workbench.tabs.templates.manage', 'Tabs: Apply Tab Template', () =>
            openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand('workbench.tabs.templates.rename', 'Tabs: Rename Tab Template', () =>
            openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand('workbench.tabs.templates.delete', 'Tabs: Delete Tab Template', () =>
            openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand(
            'workbench.tabs.templates.duplicate',
            'Tabs: Duplicate Tab Template',
            () => openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand('workbench.tabs.templates.export', 'Tabs: Export Tab Template', () =>
            openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand('workbench.tabs.templates.import', 'Tabs: Import Tab Template', () =>
            openTabWorkspaceDialog('templates'),
          ),
          workbenchCommand(
            'workbench.tabs.hibernate.active',
            'Tabs: Hibernate Active Tab',
            ({ runtime }) => {
              const tab = runtime.workbench.getActiveTab()
              if (!tab) return
              const ok = runtime.workbench.tabs.hibernateTab(tab.id, tab.groupId)
              void runtime.host.capabilities.notify?.({
                title: ok ? 'Tab hibernated' : 'Tab was not hibernated',
                message: ok ? tab.title : 'Dirty, locked, or protected tabs stay awake.',
                tone: ok ? 'info' : 'warning',
              })
              void runtime.workbench.persist()
            },
          ),
          workbenchCommand('workbench.tabs.wake.active', 'Tabs: Wake Active Tab', ({ runtime }) => {
            const tab = runtime.workbench.getActiveTab()
            if (tab) runtime.workbench.tabs.wakeTab(tab.id, tab.groupId)
            void runtime.workbench.persist()
          }),
          workbenchCommand(
            'workbench.tabs.share.current',
            'Tabs: Share Current Tab Set',
            async ({ runtime }) => {
              const set = runtime.workbench.tabs.sharing.createFromWorkspace('Shared Tab Set')
              const json = runtime.workbench.tabs.sharing.exportJson(set)
              await (runtime.host.capabilities.clipboard?.writeText?.(json) ??
                navigator.clipboard?.writeText(json))
              await runtime.host.capabilities.notify?.({
                title: 'Shared tab set copied',
                message: `${set.workspace.warnings.length} warning(s), ${json.length} bytes`,
                tone: set.workspace.warnings.length ? 'warning' : 'info',
              })
            },
          ),
          workbenchCommand('workbench.tabs.share.import', 'Tabs: Import Shared Tab Set', () =>
            openTabWorkspaceDialog('share'),
          ),
          workbenchCommand(
            'workbench.settings.open',
            'Preferences: Open Settings',
            ({ workbench }) => {
              workbench.openTab({
                id: 'workbench.settings',
                kind: 'workbench.settings',
                title: 'Settings',
                pinned: true,
                preview: false,
                ownerExtensionId: 'activelane.workbench-core',
              })
            },
            'Mod+,',
          ),
          workbenchCommand(
            'workbench.theme.system',
            'Preferences: Color Theme System',
            async ({ runtime }) => runtime.themes.setPreference('system'),
          ),
          workbenchCommand(
            'workbench.theme.light',
            'Preferences: Color Theme Light',
            async ({ runtime }) => runtime.themes.setPreference('light'),
          ),
          workbenchCommand(
            'workbench.theme.dark',
            'Preferences: Color Theme Dark',
            async ({ runtime }) => runtime.themes.setPreference('dark'),
          ),
          workbenchCommand(
            'workbench.theme.highContrast',
            'Preferences: Color Theme High Contrast',
            async ({ runtime }) => runtime.themes.setPreference('high-contrast'),
          ),
        ],
        commandPalette: [
          {
            id: 'workbench.palette.command',
            title: 'Workbench: Open Command Palette',
            commandId: 'workbench.commandPalette.open',
            category: 'Workbench',
            description: 'Open the searchable command palette.',
          },
          {
            id: 'workbench.sidebar.command',
            title: 'Workbench: Toggle Sidebar',
            commandId: 'workbench.sidebar.toggle',
            category: 'Workbench',
            description: 'Collapse or expand the sidebar region.',
          },
          {
            id: 'workbench.inspector.command',
            title: 'Workbench: Toggle Inspector',
            commandId: 'workbench.inspector.toggle',
            category: 'Workbench',
            description: 'Collapse or expand the inspector region.',
          },
          {
            id: 'workbench.split.right.command',
            title: 'Workbench: Split Active Tab Right',
            commandId: 'workbench.split.right',
            category: 'Workbench',
            description: 'Split the active tab into a new group on the right.',
          },
          {
            id: 'workbench.split.down.command',
            title: 'Workbench: Split Active Tab Down',
            commandId: 'workbench.split.down',
            category: 'Workbench',
            description: 'Split the active tab into a new group below.',
          },
          {
            id: 'workbench.group.next.command',
            title: 'Workbench: Focus Next Group',
            commandId: 'workbench.group.next',
            category: 'Workbench',
            description: 'Move focus to the next tab group.',
          },
          {
            id: 'workbench.group.previous.command',
            title: 'Workbench: Focus Previous Group',
            commandId: 'workbench.group.previous',
            category: 'Workbench',
            description: 'Move focus to the previous tab group.',
          },
          {
            id: 'workbench.tab.duplicate.command',
            title: 'Workbench: Duplicate Active Tab',
            commandId: 'workbench.tab.duplicate',
            category: 'Workbench',
            description: 'Open a copy of the active tab.',
          },
          {
            id: 'workbench.tab.reopenClosed.command',
            title: 'Workbench: Reopen Closed Tab',
            commandId: 'workbench.tab.reopenClosed',
            category: 'Workbench',
            description: 'Restore the most recently closed tab in the active group.',
          },
          {
            id: 'workbench.tab.toggleLock.command',
            title: 'Workbench: Lock or Unlock Active Tab',
            commandId: 'workbench.tab.toggleLock',
            category: 'Workbench',
            description: 'Toggle accidental-close protection for the active tab.',
          },
          {
            id: 'workbench.tab.togglePinned.command',
            title: 'Workbench: Pin or Unpin Active Tab',
            commandId: 'workbench.tab.togglePinned',
            category: 'Workbench',
            description: 'Toggle the pinned state of the active tab.',
          },
          {
            id: 'workbench.tabs.sessions.save.command',
            title: 'Save Current Session',
            commandId: 'workbench.tabs.sessions.save',
            category: 'Tabs',
            description: 'Save the current tabs, groups, indicators, and layout locally.',
            keywords: ['workspace', 'session', 'tabs'],
          },
          {
            id: 'workbench.tabs.sessions.manage.command',
            title: 'Restore Session',
            commandId: 'workbench.tabs.sessions.manage',
            category: 'Tabs',
            description:
              'Open the session picker to restore, duplicate, rename, export, or delete.',
            keywords: ['workspace', 'session', 'tabs'],
          },
          ...(
            [
              ['saveAs', 'Save Current Session As...'],
              ['rename', 'Rename Session'],
              ['duplicate', 'Duplicate Session'],
              ['delete', 'Delete Session'],
              ['export', 'Export Session'],
              ['import', 'Import Session'],
            ] as const
          ).map(([id, title]) => ({
            id: `workbench.tabs.sessions.${id}.command`,
            title,
            commandId: `workbench.tabs.sessions.${id}`,
            category: 'Tabs',
            description: 'Open the workspace session management dialog.',
            keywords: ['workspace', 'session', 'tabs'],
          })),
          {
            id: 'workbench.tabs.templates.create.command',
            title: 'Create Tab Template from Current Workspace',
            commandId: 'workbench.tabs.templates.create',
            category: 'Tabs',
            description: 'Create a reusable local template from the current tabs.',
            keywords: ['template', 'workspace', 'tabs'],
          },
          {
            id: 'workbench.tabs.templates.manage.command',
            title: 'Apply Tab Template',
            commandId: 'workbench.tabs.templates.manage',
            category: 'Tabs',
            description: 'Open the template picker to apply, duplicate, export, or delete.',
            keywords: ['template', 'workspace', 'tabs'],
          },
          ...(
            [
              ['rename', 'Rename Tab Template'],
              ['duplicate', 'Duplicate Tab Template'],
              ['delete', 'Delete Tab Template'],
              ['export', 'Export Tab Template'],
              ['import', 'Import Tab Template'],
            ] as const
          ).map(([id, title]) => ({
            id: `workbench.tabs.templates.${id}.command`,
            title,
            commandId: `workbench.tabs.templates.${id}`,
            category: 'Tabs',
            description: 'Open the tab template management dialog.',
            keywords: ['template', 'workspace', 'tabs'],
          })),
          {
            id: 'workbench.tabs.hibernate.active.command',
            title: 'Hibernate Active Tab',
            commandId: 'workbench.tabs.hibernate.active',
            category: 'Tabs',
            description: 'Suspend the active tab when it is safe to unload.',
            keywords: ['hibernate', 'suspend', 'tabs'],
          },
          {
            id: 'workbench.tabs.wake.active.command',
            title: 'Wake Active Tab',
            commandId: 'workbench.tabs.wake.active',
            category: 'Tabs',
            description: 'Restore the active hibernated tab surface.',
            keywords: ['hibernate', 'wake', 'tabs'],
          },
          {
            id: 'workbench.tabs.share.current.command',
            title: 'Share Current Tab Set',
            commandId: 'workbench.tabs.share.current',
            category: 'Tabs',
            description: 'Copy a sanitized shared tab set JSON payload.',
            keywords: ['share', 'export', 'tabs'],
          },
          {
            id: 'workbench.tabs.share.import.command',
            title: 'Import Shared Tab Set',
            commandId: 'workbench.tabs.share.import',
            category: 'Tabs',
            description: 'Open the shared tab set import dialog.',
            keywords: ['share', 'import', 'tabs'],
          },
          {
            id: 'workbench.settings.open.command',
            title: 'Preferences: Open Settings',
            commandId: 'workbench.settings.open',
            category: 'Preferences',
            description: 'Open the workbench settings tab.',
            keywords: ['settings', 'preferences', 'theme'],
          },
          {
            id: 'workbench.theme.system.command',
            title: 'Preferences: Color Theme System',
            commandId: 'workbench.theme.system',
            category: 'Preferences',
            description: 'Follow the browser or operating system color scheme.',
            keywords: ['theme', 'system'],
          },
          {
            id: 'workbench.theme.light.command',
            title: 'Preferences: Color Theme Light',
            commandId: 'workbench.theme.light',
            category: 'Preferences',
            description: 'Use ActiveLane Light.',
            keywords: ['theme', 'light'],
          },
          {
            id: 'workbench.theme.dark.command',
            title: 'Preferences: Color Theme Dark',
            commandId: 'workbench.theme.dark',
            category: 'Preferences',
            description: 'Use ActiveLane Dark.',
            keywords: ['theme', 'dark'],
          },
          {
            id: 'workbench.theme.highContrast.command',
            title: 'Preferences: Color Theme High Contrast',
            commandId: 'workbench.theme.highContrast',
            category: 'Preferences',
            description: 'Use ActiveLane High Contrast.',
            keywords: ['theme', 'contrast', 'accessibility'],
          },
        ],
        menus: [
          {
            id: 'workbench.menu.view.sidebar',
            title: 'Toggle Sidebar',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.sidebar.toggle',
            order: 10,
          },
          {
            id: 'workbench.menu.view.inspector',
            title: 'Toggle Inspector',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.inspector.toggle',
            order: 20,
          },
          {
            id: 'workbench.menu.edit.undo',
            title: 'Undo',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.undo',
            nativeRole: 'undo',
            when: 'isDesktop',
            order: 10,
          },
          {
            id: 'workbench.menu.edit.redo',
            title: 'Redo',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.redo',
            nativeRole: 'redo',
            when: 'isDesktop',
            order: 20,
          },
          {
            id: 'workbench.menu.edit.separator.clipboard',
            title: 'Clipboard Separator',
            kind: 'separator',
            location: 'global/app',
            group: 'edit',
            when: 'isDesktop',
            order: 30,
          },
          {
            id: 'workbench.menu.edit.cut',
            title: 'Cut',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.cut',
            nativeRole: 'cut',
            when: 'isDesktop',
            order: 40,
          },
          {
            id: 'workbench.menu.edit.copy',
            title: 'Copy',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.copy',
            nativeRole: 'copy',
            when: 'isDesktop',
            order: 50,
          },
          {
            id: 'workbench.menu.edit.paste',
            title: 'Paste',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.paste',
            nativeRole: 'paste',
            when: 'isDesktop',
            order: 60,
          },
          {
            id: 'workbench.menu.edit.selectAll',
            title: 'Select All',
            location: 'global/app',
            group: 'edit',
            commandId: 'native.edit.selectAll',
            nativeRole: 'selectAll',
            when: 'isDesktop',
            order: 70,
          },
          {
            id: 'workbench.menu.window.minimize',
            title: 'Minimize',
            location: 'global/app',
            group: 'window',
            commandId: 'native.window.minimize',
            nativeRole: 'minimize',
            when: 'isDesktop',
            order: 10,
          },
          {
            id: 'workbench.menu.window.close',
            title: 'Close Window',
            location: 'global/app',
            group: 'window',
            commandId: 'native.window.close',
            nativeRole: 'close',
            when: 'isDesktop',
            order: 20,
          },
          {
            id: 'workbench.menu.window.front',
            title: 'Bring All to Front',
            location: 'global/app',
            group: 'window',
            commandId: 'native.window.front',
            nativeRole: 'front',
            when: 'isMac',
            order: 30,
          },
          {
            id: 'workbench.menu.go.nextGroup',
            title: 'Focus Next Group',
            location: 'global/app',
            group: 'go',
            commandId: 'workbench.group.next',
            order: 10,
          },
          {
            id: 'workbench.menu.go.previousGroup',
            title: 'Focus Previous Group',
            location: 'global/app',
            group: 'go',
            commandId: 'workbench.group.previous',
            order: 20,
          },
          {
            id: 'workbench.menu.help.welcome',
            title: 'Welcome',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.welcome.open',
            order: 10,
          },
          {
            id: 'workbench.menu.help.show-all-commands',
            title: 'Show All Commands',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.commandPalette.open',
            order: 20,
          },
          // documentation
          {
            id: 'workbench.menu.help.documentation',
            title: 'Documentation',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.documentation.open',
            order: 30,
          },
          // open walkthrough
          {
            id: 'workbench.menu.help.walkthroughs',
            title: 'Walkthroughs',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.walkthroughs.open',
            order: 40,
          },
          // show release notes
          {
            id: 'workbench.menu.help.release-notes',
            title: 'Release Notes',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.releaseNotes.open',
            order: 50,
          },
          // keyboard shortcut reference
          {
            id: 'workbench.menu.help.keyboard-shortcuts',
            title: 'Keyboard Shortcuts',
            location: 'global/app',
            group: 'help',
            commandId: 'workbench.keyboardShortcuts.open',
            order: 60,
          },
          {
            id: 'workbench.menu.view.commandPalette',
            title: 'Open Command Palette',
            location: 'global/app',
            group: 'view',
            commandId: 'workbench.commandPalette.open',
            order: 30,
          },
        ],
      },
    },
    activate(context) {
      return context.contribute.tabActions({
        id: 'workbench.demo.markTabReviewed',
        title: 'Mark Tab Reviewed',
        category: 'Verification',
        order: 900,
        run({ workbench, tab, groupId }) {
          workbench.tabs.setTabIndicator(
            tab.id,
            {
              id: 'workbench.reviewed',
              label: 'Reviewed',
              tooltip: 'Marked by a dynamic tab action.',
              icon: 'lucide.badge-check',
              severity: 'success',
              persist: true,
            },
            groupId,
          )
          void workbench.persist()
        },
      })
    },
  })
}

import type {
  WorkbenchCommandContribution,
  WorkbenchCommandExecutionContext,
  WorkbenchComponent,
  WorkbenchExtensionDefinition,
  WorkbenchFileHandle,
  WorkbenchMenuItemContribution,
  WorkbenchTab,
} from '@activelane/workbench-api'
import { defineWorkbenchExtension } from '@activelane/workbench-api'
import WorkbenchTextFileEditor from '../file/WorkbenchTextFileEditor.vue'

export const WORKBENCH_TEXT_FILE_TAB_KIND = 'workbench.file.text'

const asWorkbenchComponent = (component: unknown) => component as WorkbenchComponent

function fileCommand(
  id: string,
  title: string,
  run: WorkbenchCommandContribution['run'],
  options: Partial<WorkbenchCommandContribution> = {},
): WorkbenchCommandContribution {
  return {
    id,
    title,
    category: 'File',
    ...options,
    run,
  }
}

function unsupported(title: string, message: string) {
  return async ({ runtime }: WorkbenchCommandExecutionContext) => {
    console.info(`[ActiveLane/File] ${title}: ${message}`)
    await runtime.host.capabilities.notify?.({
      title,
      message,
      tone: 'info',
    })
  }
}

function fileName(handle: WorkbenchFileHandle) {
  return handle.name || handle.path?.split(/[\\/]/).pop() || 'Untitled'
}

function openTextTab(
  { runtime }: WorkbenchCommandExecutionContext,
  handle: WorkbenchFileHandle,
  dirty = false,
) {
  const name = fileName(handle)
  runtime.workbench.openTab(
    {
      id: handle.path ? `file:text:${handle.path}` : `untitled:${Date.now()}`,
      kind: WORKBENCH_TEXT_FILE_TAB_KIND,
      title: name,
      icon: runtime.workbench.ui.getIcon('FileText'),
      closable: true,
      preview: false,
      dirty,
      capabilities: ['file.save', 'file.revert'],
      input: {
        name,
        path: handle.path,
        contents: handle.contents ?? '',
      },
    },
    { mode: 'persistent', source: 'command' },
  )
}

function activeFileHandle(context: WorkbenchCommandExecutionContext): WorkbenchFileHandle | null {
  const tab = context.runtime.workbench.getActiveTab()
  if (!tab || tab.kind !== WORKBENCH_TEXT_FILE_TAB_KIND) return null
  return {
    name: typeof tab.input?.name === 'string' ? tab.input.name : tab.title,
    path: typeof tab.input?.path === 'string' ? tab.input.path : undefined,
    contents: typeof tab.input?.contents === 'string' ? tab.input.contents : '',
  }
}

async function saveActive(context: WorkbenchCommandExecutionContext, forceSaveAs = false) {
  const handle = activeFileHandle(context)
  const tab = context.runtime.workbench.getActiveTab()
  if (!handle || !tab) {
    await context.runtime.host.capabilities.notify?.({
      title: 'Save is unavailable',
      message: 'The active tab does not expose a writable file contract yet.',
      tone: 'warning',
    })
    return
  }

  const saved =
    forceSaveAs || !handle.path
      ? await context.runtime.host.capabilities.files?.saveAs?.(handle)
      : (await context.runtime.host.capabilities.files?.save?.(handle), handle)
  if (!saved) return

  tab.input = { ...(tab.input ?? {}), ...saved }
  context.runtime.workbench.setTabTitle(tab.id, fileName(saved), tab.groupId)
  context.runtime.workbench.markTabDirty(tab.id, false, tab.groupId)
}

function collectTabs(context: WorkbenchCommandExecutionContext) {
  const tabs: WorkbenchTab[] = []
  const queue = [context.runtime.workbench.state.layout]
  while (queue.length) {
    const node = queue.shift()
    if (!node) continue
    if (node.kind === 'split') {
      queue.push(...node.children)
      continue
    }
    tabs.push(...node.tabs)
  }
  return tabs
}

async function openPickedFile(context: WorkbenchCommandExecutionContext) {
  const handle = await context.runtime.host.capabilities.files?.open?.()
  if (!handle) return
  openTextTab(context, handle, false)
  await rememberRecent(context, { type: 'file', label: handle.name, path: handle.path })
}

type RecentEntry = {
  type: 'file' | 'folder' | 'workspace'
  label: string
  path?: string
  openedAt: string
}

async function rememberRecent(
  context: WorkbenchCommandExecutionContext,
  entry: Omit<RecentEntry, 'openedAt'>,
) {
  const storage = context.runtime.host.capabilities.storage?.scope('workbench.file')
  if (!storage || !entry.path) return
  const previous = (await storage.get<RecentEntry[]>('recent')) ?? []
  const next = [
    { ...entry, openedAt: new Date().toISOString() },
    ...previous.filter((item) => item.path !== entry.path),
  ].slice(0, 20)
  await storage.set('recent', next)
}

async function clearRecent(context: WorkbenchCommandExecutionContext) {
  await context.runtime.host.capabilities.storage?.scope('workbench.file')?.set('recent', [])
}

const disabledImplementationPath =
  'Implementation path: add the missing workspace/profile/file mutation host capability, then replace this disabled command with that contract.'

function disabledFileCommand(id: string, title: string, description: string) {
  return fileCommand(
    id,
    title,
    unsupported(title, `${description} ${disabledImplementationPath}`),
    {
      enabled: false,
      description,
    },
  )
}

const commands: WorkbenchCommandContribution[] = [
  fileCommand(
    'workbench.file.newUntitled',
    'New Text File',
    (context) => openTextTab(context, { name: 'Untitled', contents: '' }, true),
    { icon: 'FileText', shortcut: 'Mod+N', description: 'Create an untitled dirty text editor.' },
  ),
  fileCommand(
    'workbench.file.newFile',
    'New File',
    (context) => openTextTab(context, { name: 'Untitled', contents: '' }, true),
    {
      icon: 'FilePlus',
      shortcut: 'Mod+Alt+N',
      description: 'Falls back to an untitled editor until explorer inline creation is available.',
    },
  ),
  disabledFileCommand(
    'workbench.file.newWindow',
    'New Window',
    'Desktop window creation is not exposed to the renderer host yet.',
  ),
  disabledFileCommand(
    'workbench.file.newWindowWithProfile',
    'New Window With Profile',
    'Profiles are not represented in the runtime settings model yet.',
  ),
  fileCommand('workbench.file.openFile', 'Open File...', openPickedFile, {
    icon: 'FolderOpen',
    shortcut: 'Mod+O',
    description: 'Open a file using the desktop file picker or host file picker.',
  }),
  fileCommand(
    'workbench.file.openFolder',
    'Open Folder...',
    async (context) => {
      const path = await context.runtime.host.capabilities.files?.openFolder?.()
      if (!path) return
      await rememberRecent(context, {
        type: 'folder',
        label: path.split(/[\\/]/).pop() || path,
        path,
      })
      await context.runtime.explorer.refresh()
      await context.runtime.host.capabilities.notify?.({
        title: 'Folder selected',
        message: path,
        tone: 'info',
      })
    },
    { icon: 'FolderOpen', shortcut: 'Mod+K Mod+O' },
  ),
  fileCommand(
    'workbench.file.openWorkspaceFromFile',
    'Open Workspace from File...',
    async (context) => {
      const handle = await context.runtime.host.capabilities.files?.openWorkspaceFile?.()
      if (!handle) return
      await rememberRecent(context, {
        type: 'workspace',
        label: handle.name,
        path: handle.path,
      })
      await context.runtime.host.capabilities.notify?.({
        title: 'Workspace file selected',
        message:
          '.activelane-workspace and .code-workspace parsing will attach roots once workspace root state lands.',
        tone: 'info',
      })
    },
    { icon: 'FolderSymlink' },
  ),
  fileCommand('workbench.file.clearRecent', 'Clear Recent', clearRecent, {
    icon: 'Eraser',
    description: 'Clear persisted File menu recent entries.',
  }),
  disabledFileCommand(
    'workbench.file.addFolderToWorkspace',
    'Add Folder to Workspace...',
    'Multi-root workspace state is not available in the explorer provider yet.',
  ),
  disabledFileCommand(
    'workbench.file.saveWorkspaceAs',
    'Save Workspace As...',
    'Workspace file serialization needs a persisted roots/settings contract.',
  ),
  fileCommand(
    'workbench.file.duplicateWorkspace',
    'Duplicate Workspace',
    (context) => context.runtime.commands.execute('workbench.tabs.sessions.duplicate'),
    { icon: 'Copy' },
  ),
  fileCommand('workbench.file.save', 'Save', (context) => saveActive(context), {
    icon: 'Save',
    shortcut: 'Mod+S',
    description: 'Save the active writable text file.',
  }),
  fileCommand('workbench.file.saveAs', 'Save As...', (context) => saveActive(context, true), {
    icon: 'Save',
    shortcut: 'Mod+Shift+S',
  }),
  fileCommand(
    'workbench.file.saveAll',
    'Save All',
    async (context) => {
      const active = context.runtime.workbench.getActiveTab()
      const dirtyTextTabs = collectTabs(context).filter(
        (tab) => tab.kind === WORKBENCH_TEXT_FILE_TAB_KIND && tab.dirty,
      )
      for (const tab of dirtyTextTabs) {
        context.runtime.workbench.activateTab(tab.id, tab.groupId)
        await saveActive(context)
      }
      if (active) context.runtime.workbench.activateTab(active.id, active.groupId)
    },
    { icon: 'SaveAll', shortcut: 'Mod+Alt+S' },
  ),
  fileCommand(
    'workbench.file.share.copyPath',
    'Copy Path',
    async (context) => {
      const handle = activeFileHandle(context)
      if (!handle?.path) return
      await context.runtime.host.capabilities.clipboard?.writeText?.(handle.path)
    },
    { icon: 'Copy' },
  ),
  fileCommand(
    'workbench.file.share.revealInFileManager',
    'Reveal in File Manager',
    async (context) => {
      const handle = activeFileHandle(context)
      if (handle?.path) {
        await context.runtime.host.capabilities.files?.revealInFileManager?.(handle.path)
      }
    },
    { icon: 'ExternalLink' },
  ),
  fileCommand(
    'workbench.file.autoSave',
    'Auto Save',
    async ({ runtime }) => {
      await runtime.settings.set(
        'files.autoSave',
        !runtime.settings.get<boolean>('files.autoSave', false),
      )
    },
    { icon: 'RefreshCw' },
  ),
  fileCommand(
    'workbench.file.preferences',
    'Preferences',
    ({ runtime }) => runtime.commands.execute('workbench.settings.open'),
    { icon: 'Settings', shortcut: 'Mod+,' },
  ),
  fileCommand(
    'workbench.file.revert',
    'Revert File',
    async (context) => {
      const handle = activeFileHandle(context)
      const tab = context.runtime.workbench.getActiveTab()
      if (!handle?.path || !tab) return
      const confirmed = await context.runtime.host.capabilities.confirm?.({
        title: 'Revert File',
        message: `Discard unsaved changes to ${tab.title}?`,
        confirmLabel: 'Revert',
        cancelLabel: 'Cancel',
      })
      if (!confirmed) return
      const disk = await context.runtime.host.capabilities.files?.read?.(handle.path)
      if (!disk) return
      tab.input = { ...(tab.input ?? {}), contents: disk.contents ?? '' }
      context.runtime.workbench.markTabDirty(tab.id, false, tab.groupId)
    },
    { icon: 'Undo2' },
  ),
  fileCommand(
    'workbench.file.close',
    'Close',
    ({ runtime }) => runtime.commands.execute('workbench.tab.close'),
    {
      icon: 'X',
      shortcut: 'Mod+W',
    },
  ),
  disabledFileCommand(
    'workbench.file.closeFolder',
    'Close Folder',
    'The explorer provider does not yet expose a mutable current root to close.',
  ),
  fileCommand(
    'workbench.file.closeWindow',
    'Close Window',
    ({ runtime }) =>
      void (
        runtime.host.capabilities.lifecycle?.closeWindow?.() ??
        runtime.commands.execute('workbench.tab.close')
      ),
    { icon: 'PanelTopClose' },
  ),
  fileCommand(
    'workbench.file.exit',
    'Exit',
    ({ runtime }) =>
      void (
        runtime.host.capabilities.lifecycle?.closeWindow?.() ??
        runtime.commands.execute('workbench.tab.close')
      ),
    { icon: 'LogOut' },
  ),
]

function menuItem(
  id: string,
  title: string,
  commandId: string,
  order: number,
  extra: Partial<WorkbenchMenuItemContribution> = {},
): WorkbenchMenuItemContribution {
  return {
    id,
    title,
    location: 'global/app',
    group: 'file',
    commandId,
    order,
    ...extra,
  }
}

function separator(id: string, order: number): WorkbenchMenuItemContribution {
  return {
    id,
    title: id,
    kind: 'separator',
    location: 'global/app',
    group: 'file',
    order,
  }
}

export function createWorkbenchFileContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.workbench-file',
      name: 'workbench-file',
      displayName: 'Workbench File Menu',
      version: '0.1.0',
      description: 'VS Code-style File menu commands and text file editor integration.',
      builtin: true,
      activationEvents: ['onStartup'],
      contributes: {
        tabRenderers: [
          {
            id: 'workbench.file.text.renderer',
            title: 'Text File Editor',
            tabKind: WORKBENCH_TEXT_FILE_TAB_KIND,
            component: asWorkbenchComponent(WorkbenchTextFileEditor),
          },
        ],
        commands,
        commandPalette: commands.map((command, index) => ({
          id: `${command.id}.palette`,
          title: command.title,
          commandId: command.id,
          category: 'File',
          description: command.description,
          icon: command.icon,
          enabled: command.enabled,
          order: index,
        })),
        menus: [
          menuItem(
            'workbench.menu.file.newTextFile',
            'New Text File',
            'workbench.file.newUntitled',
            10,
          ),
          menuItem('workbench.menu.file.newFile', 'New File...', 'workbench.file.newFile', 20),
          menuItem('workbench.menu.file.newWindow', 'New Window', 'workbench.file.newWindow', 30),
          menuItem(
            'workbench.menu.file.newWindowWithProfile',
            'New Window With Profile',
            'workbench.file.newWindowWithProfile',
            40,
          ),
          separator('workbench.menu.file.separator.open', 50),
          menuItem('workbench.menu.file.openFile', 'Open File...', 'workbench.file.openFile', 60),
          menuItem(
            'workbench.menu.file.openFolder',
            'Open Folder...',
            'workbench.file.openFolder',
            70,
          ),
          menuItem(
            'workbench.menu.file.openWorkspace',
            'Open Workspace from File...',
            'workbench.file.openWorkspaceFromFile',
            80,
          ),
          {
            id: 'workbench.menu.file.openRecent',
            title: 'Open Recent',
            kind: 'submenu',
            location: 'global/app',
            group: 'file',
            submenu: 'file.openRecent',
            order: 90,
          },
          separator('workbench.menu.file.separator.workspace', 100),
          menuItem(
            'workbench.menu.file.addFolder',
            'Add Folder to Workspace...',
            'workbench.file.addFolderToWorkspace',
            110,
          ),
          menuItem(
            'workbench.menu.file.saveWorkspaceAs',
            'Save Workspace As...',
            'workbench.file.saveWorkspaceAs',
            120,
          ),
          menuItem(
            'workbench.menu.file.duplicateWorkspace',
            'Duplicate Workspace',
            'workbench.file.duplicateWorkspace',
            130,
          ),
          separator('workbench.menu.file.separator.save', 140),
          menuItem('workbench.menu.file.save', 'Save', 'workbench.file.save', 150, {
            enablement: 'activeTabKind == workbench.file.text',
          }),
          menuItem('workbench.menu.file.saveAs', 'Save As...', 'workbench.file.saveAs', 160, {
            enablement: 'activeTabKind == workbench.file.text',
          }),
          menuItem('workbench.menu.file.saveAll', 'Save All', 'workbench.file.saveAll', 170, {
            enablement: 'activeTabDirty',
          }),
          separator('workbench.menu.file.separator.share', 180),
          {
            id: 'workbench.menu.file.share',
            title: 'Share',
            kind: 'submenu',
            location: 'global/app',
            group: 'file',
            submenu: 'file.share',
            order: 190,
          },
          menuItem('workbench.menu.file.autoSave', 'Auto Save', 'workbench.file.autoSave', 200, {
            checked: 'filesAutoSave',
          }),
          menuItem(
            'workbench.menu.file.preferences',
            'Preferences',
            'workbench.file.preferences',
            210,
          ),
          separator('workbench.menu.file.separator.close', 220),
          menuItem('workbench.menu.file.revert', 'Revert File', 'workbench.file.revert', 230, {
            enablement: 'activeTabDirty',
          }),
          menuItem('workbench.menu.file.close', 'Close', 'workbench.file.close', 240),
          menuItem(
            'workbench.menu.file.closeFolder',
            'Close Folder',
            'workbench.file.closeFolder',
            250,
          ),
          menuItem(
            'workbench.menu.file.closeWindow',
            'Close Window',
            'workbench.file.closeWindow',
            260,
            { when: 'isDesktop' },
          ),
          menuItem('workbench.menu.file.exit', 'Exit', 'workbench.file.exit', 270, {
            when: '!isMac',
          }),
          menuItem(
            'workbench.menu.file.openRecent.clear',
            'Clear Recent',
            'workbench.file.clearRecent',
            10,
            {
              group: 'file.openRecent',
            },
          ),
          menuItem(
            'workbench.menu.file.share.copyPath',
            'Copy Path',
            'workbench.file.share.copyPath',
            10,
            {
              group: 'file.share',
              enablement: 'activeTabKind == workbench.file.text',
            },
          ),
          menuItem(
            'workbench.menu.file.share.reveal',
            'Reveal in File Manager',
            'workbench.file.share.revealInFileManager',
            20,
            {
              group: 'file.share',
              when: 'isDesktop',
              enablement: 'activeTabKind == workbench.file.text',
            },
          ),
        ],
      },
    },
  })
}

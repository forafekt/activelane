import type {
  ActiveLaneCapability,
  ActiveLaneCapabilityHandler,
  ActiveLaneCapabilityRecord,
  ActiveLaneCapabilityService,
  ActiveLaneRuntimeContext,
  CreateWorkbenchRuntimeOptions,
  Disposable,
  FileOpenerContribution,
  FileOpenerService,
  FileOpenIntent,
  InstalledExtensionRecord,
  WorkbenchActionContribution,
  WorkbenchActivityContribution,
  WorkbenchApplicationContribution,
  WorkbenchBottomPaneContribution,
  WorkbenchCommandContribution,
  WorkbenchCommandExecutionContext,
  WorkbenchCommandPaletteContribution,
  WorkbenchContributionRegistrar,
  WorkbenchExtensionCatalogEntry,
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
  WorkbenchGlobalMenuContribution,
  WorkbenchInspectorPanelContribution,
  WorkbenchMenuItemContribution,
  WorkbenchPartContribution,
  WorkbenchRegisteredContributions,
  WorkbenchRuntimeApi,
  WorkbenchRuntimeExtensionRecord,
  WorkbenchSettingsContribution,
  WorkbenchSettingsPageContribution,
  WorkbenchShellApi,
  WorkbenchSidebarViewContribution,
  WorkbenchStatusBarItemContribution,
  WorkbenchTabRendererContribution,
  WorkbenchTabSurfaceContribution,
} from '../index'
import { createActiveLaneServerRuntime } from '../server'
import { createCommandSearchService } from '../workbench/commands'
import { preferenceKeyForFileOpenIntent, resolveFileOpeners } from '../workbench/fileOpeners'
import { normalizeWorkbenchContribution } from '../workbench/normalizeComponents'
import { WORKBENCH_SHELL_STORAGE_KEY } from '../workbench/shell'
import type {
  WorkbenchRegisteredTabAction,
  WorkbenchRegisteredTabGroupAction,
  WorkbenchSharedTabSet,
  WorkbenchTabCollectionService,
  WorkbenchTabSession,
  WorkbenchTabTemplate,
  WorkbenchWorkspaceApplyOptions,
} from '../workbench/tabWorkspace'
import { createTabWorkspaceId, parseWorkbenchTabPayload } from '../workbench/tabWorkspace'
import { createWorkbenchUI } from '../workbench/ui'
import { createRuntimeContext } from './context'
import { createExplorerService } from './createExplorerService'
import { createSettingsService, normalizeManifestSettings } from './createSettingsService'
import { createThemeService } from './createThemeService'
import { createWorkbenchStore } from './createWorkbenchStore'
import { resolveWorkbenchReactivity } from './reactivity'

type ContributionKey = keyof WorkbenchRegisteredContributions
type RegistrableContribution = WorkbenchRegisteredContributions[ContributionKey][number]

interface ActiveExtensionState {
  disposable?: Disposable
  dynamicDisposables: Disposable[]
}

interface RuntimePersistenceController {
  timeoutId: number | null
}

interface RegisteredCapabilityHandler {
  handler?: ActiveLaneCapabilityHandler
}

function sortByOrder<T extends RegistrableContribution>(items: T[]) {
  return items
    .slice()
    .sort(
      (left, right) =>
        (left.order ?? 0) - (right.order ?? 0) ||
        contributionTitle(left).localeCompare(contributionTitle(right)),
    )
}

function contributionTitle(item: RegistrableContribution) {
  return 'title' in item && typeof item.title === 'string'
    ? item.title
    : 'label' in item && typeof item.label === 'string'
      ? item.label
      : item.id
}

function createMemoryStorageScope() {
  const map = new Map<string, unknown>()
  return {
    async get<T>(key: string) {
      return map.get(key) as T | undefined
    },
    async set<T>(key: string, value: T) {
      map.set(key, value)
    },
    async remove(key: string) {
      map.delete(key)
    },
  }
}

function refreshRecordStatus(record: WorkbenchRuntimeExtensionRecord) {
  if (record.error || record.surfaceErrors.length) {
    record.status = 'error'
    return
  }
  if (record.active) {
    record.status = 'active'
    return
  }
  if (record.installed && record.enabled) {
    record.status = 'inactive'
    return
  }
  record.status = record.installed ? 'installed' : 'discovered'
}

function isExperimentalExtension(definition: WorkbenchExtensionDefinition) {
  const manifest = definition.manifest
  return [...(manifest.categories ?? []), ...(manifest.keywords ?? [])].some((value) =>
    value.toLowerCase().includes('experimental'),
  )
}

export async function createExtensionRuntime(
  options: CreateWorkbenchRuntimeOptions,
): Promise<WorkbenchRuntimeApi> {
  const reactivity = resolveWorkbenchReactivity(options.reactivity)
  const shell = createWorkbenchStore(options.host, options.initialState, reactivity)
  const storage =
    options.host.capabilities.storage?.scope('workbench.shell') ?? createMemoryStorageScope()
  const persisted = await storage.get<typeof shell.state>(WORKBENCH_SHELL_STORAGE_KEY)
  if (persisted) shell.restore(persisted)
  const themeStorage =
    options.host.capabilities.storage?.scope('workbench.themes') ?? createMemoryStorageScope()
  const themes = await createThemeService(themeStorage, reactivity)
  const settingsStorage =
    options.host.capabilities.storage?.scope('workbench.settings') ?? createMemoryStorageScope()
  const settings = await createSettingsService(settingsStorage, reactivity)
  const explorerStorage =
    options.host.capabilities.storage?.scope('workbench.explorer') ?? createMemoryStorageScope()
  const explorer = await createExplorerService(explorerStorage, reactivity)
  const fileOpenerStorage =
    options.host.capabilities.storage?.scope('workbench.fileOpeners') ?? createMemoryStorageScope()
  const ui = createWorkbenchUI(options.ui)
  const capabilityEntries = reactivity.reactive<ActiveLaneCapabilityRecord[]>([])
  const capabilityHandlers = new Map<string, RegisteredCapabilityHandler>()
  const rootCapabilities = createCapabilityService()
  const server =
    options.host.server ??
    createActiveLaneServerRuntime({
      hostKind: options.host.kind,
      capabilities: rootCapabilities,
      launcher: options.server?.launcher,
      now: options.server?.now,
    })
  const host = {
    ...options.host,
    server,
    capabilities: {
      ...options.host.capabilities,
      notify: async (...args: Parameters<NonNullable<typeof options.host.capabilities.notify>>) => {
        if (settings.get<boolean>('workbench.notifications.enabled') === false) return undefined
        return options.host.capabilities.notify?.(...args)
      },
    },
  }
  const context: ActiveLaneRuntimeContext = createRuntimeContext(host, {
    runtimeId: options.runtimeId ?? `${host.kind}:${host.id}`,
    appVersion: options.appVersion,
  })
  const workbench: WorkbenchShellApi = {
    ...shell,
    state: shell.state,
    openTab(input, behavior) {
      return shell.openTab(
        {
          ...input,
          preview:
            input.preview ??
            (behavior?.mode
              ? behavior.mode === 'preview'
              : (settings.get<boolean>('workbench.editor.previewMode') ?? true)),
        },
        behavior,
      )
    },
    setSidebarSize(size) {
      shell.setSidebarSize(size)
      void settings.set('workbench.layout.sidebar.width', shell.state.sidebar.size)
    },
    setSidebarCollapsed(collapsed) {
      shell.setSidebarCollapsed(collapsed)
      void settings.set('workbench.layout.sidebar.collapsed', collapsed)
    },
    setInspectorCollapsed(collapsed) {
      shell.setInspectorCollapsed(collapsed)
      void settings.set('workbench.layout.inspector.collapsed', collapsed)
    },
    setBottomPanelOpen(open) {
      shell.setBottomPanelOpen(open)
      void settings.set('workbench.layout.bottomPanel.open', open)
    },
    setActiveBottomPanelView(viewId) {
      shell.setActiveBottomPanelView(viewId)
    },
    ui,
    tabs: shell.tabs,
  }

  const registry = reactivity.reactive<WorkbenchRegisteredContributions>({
    parts: [],
    statusBar: [],
    globalMenus: [],
    activityRail: [],
    apps: [],
    sidebarViews: [],
    commands: [],
    commandPalette: [],
    tabRenderers: [],
    tabSurfaces: [],
    tabToolbarActions: [],
    tabContextMenu: [],
    bottomPaneViews: [],
    inspectorPanels: [],
    settingsPages: [],
    menus: [],
    fileOpeners: [],
  })

  const definitions = new Map<string, WorkbenchExtensionDefinition>()
  const extensionState = new Map<string, ActiveExtensionState>()
  const discovered = reactivity.reactive<WorkbenchExtensionCatalogEntry[]>([])
  const records = reactivity.reactive<WorkbenchRuntimeExtensionRecord[]>([])
  const persistence: RuntimePersistenceController = { timeoutId: null }
  const installedRecords = reactivity.reactive<InstalledExtensionRecord[]>([
    ...(options.installedExtensions ?? []),
    ...((await host.capabilities.extensions?.listInstalled?.()) ?? []),
  ])

  function setRegistryList<T extends ContributionKey>(
    key: T,
    values: WorkbenchRegisteredContributions[T],
  ) {
    const nextValues = sortByOrder([
      ...(values as RegistrableContribution[]),
    ]) as WorkbenchRegisteredContributions[T]
    ;(registry[key] as RegistrableContribution[]).splice(0, registry[key].length, ...nextValues)
  }

  function pushOwned<T extends RegistrableContribution>(items: T[], ownerExtensionId: string): T[] {
    return items.map((item) => ({
      ...item,
      ownerExtensionId: item.ownerExtensionId ?? ownerExtensionId,
    })) as T[]
  }

  function registerList<T extends ContributionKey>(
    key: T,
    ownerExtensionId: string,
    values: WorkbenchRegisteredContributions[T],
  ): Disposable {
    const ownedValues = pushOwned(values as RegistrableContribution[], ownerExtensionId).map(
      (item) => normalizeWorkbenchContribution(key, item as never, reactivity.markRaw),
    ) as WorkbenchRegisteredContributions[T]
    setRegistryList(key, [...registry[key], ...ownedValues] as WorkbenchRegisteredContributions[T])
    return {
      dispose() {
        const nextValues = registry[key].filter(
          (item) => item.ownerExtensionId !== ownerExtensionId,
        ) as WorkbenchRegisteredContributions[T]
        setRegistryList(key, nextValues)
      },
    }
  }

  function createRegistrar(ownerExtensionId: string): WorkbenchContributionRegistrar {
    return {
      activityRail: (...items: WorkbenchActivityContribution[]) =>
        registerList('activityRail', ownerExtensionId, items),
      apps: (...items: WorkbenchApplicationContribution[]) =>
        registerList('apps', ownerExtensionId, items),
      parts: (...items: WorkbenchPartContribution[]) =>
        registerList('parts', ownerExtensionId, items),
      statusBar: (...items: WorkbenchStatusBarItemContribution[]) =>
        registerList('statusBar', ownerExtensionId, items),
      globalMenus: (...items: WorkbenchGlobalMenuContribution[]) =>
        registerList('globalMenus', ownerExtensionId, items),
      sidebarViews: (...items: WorkbenchSidebarViewContribution[]) =>
        registerList('sidebarViews', ownerExtensionId, items),
      commands: (...items: WorkbenchCommandContribution[]) =>
        registerList('commands', ownerExtensionId, items),
      commandPalette: (...items: WorkbenchCommandPaletteContribution[]) =>
        registerList('commandPalette', ownerExtensionId, items),
      tabRenderers: (...items: WorkbenchTabRendererContribution[]) =>
        registerList('tabRenderers', ownerExtensionId, items),
      tabSurfaces: (...items: WorkbenchTabSurfaceContribution[]) =>
        registerList('tabSurfaces', ownerExtensionId, items),
      tabToolbarActions: (...items: WorkbenchActionContribution[]) =>
        registerList('tabToolbarActions', ownerExtensionId, items),
      tabContextMenu: (...items: WorkbenchMenuItemContribution[]) =>
        registerList('tabContextMenu', ownerExtensionId, items),
      bottomPaneViews: (...items: WorkbenchBottomPaneContribution[]) =>
        registerList('bottomPaneViews', ownerExtensionId, items),
      inspectorPanels: (...items: WorkbenchInspectorPanelContribution[]) =>
        registerList('inspectorPanels', ownerExtensionId, items),
      settingsPages: (...items: WorkbenchSettingsPageContribution[]) =>
        registerList('settingsPages', ownerExtensionId, items),
      settings: (contribution: WorkbenchSettingsContribution) =>
        settings.register({
          ...contribution,
          ownerExtensionId: contribution.ownerExtensionId ?? ownerExtensionId,
          ownerExtensionName:
            contribution.ownerExtensionName ??
            definitions.get(ownerExtensionId)?.manifest.displayName ??
            ownerExtensionId,
        }),
      menus: (...items: WorkbenchMenuItemContribution[]) =>
        registerList('menus', ownerExtensionId, items),
      fileOpeners: (...items: FileOpenerContribution[]) =>
        registerList('fileOpeners', ownerExtensionId, items),
      tabActions: (...items: WorkbenchRegisteredTabAction[]) => {
        const disposables = items.map((item) =>
          workbench.tabs.registerTabAction({
            ...item,
            ownerExtensionId: item.ownerExtensionId ?? ownerExtensionId,
          }),
        )
        return {
          dispose: () =>
            disposables.forEach((item) => {
              item.dispose()
            }),
        }
      },
      tabGroupActions: (...items: WorkbenchRegisteredTabGroupAction[]) => {
        const disposables = items.map((item) =>
          workbench.tabs.registerTabGroupAction({
            ...item,
            ownerExtensionId: item.ownerExtensionId ?? ownerExtensionId,
          }),
        )
        return {
          dispose: () =>
            disposables.forEach((item) => {
              item.dispose()
            }),
        }
      },
    }
  }

  function createCapabilityService(defaultExtensionId?: string): ActiveLaneCapabilityService {
    const list = (
      filter?: Partial<Pick<ActiveLaneCapability, 'kind' | 'extensionId' | 'providerId'>>,
    ) =>
      capabilityEntries.filter((entry) => {
        if (filter?.kind && entry.kind !== filter.kind) return false
        if (filter?.extensionId && entry.extensionId !== filter.extensionId) return false
        if (filter?.providerId && entry.providerId !== filter.providerId) return false
        return true
      })

    return {
      entries: capabilityEntries,
      list,
      get(capabilityId) {
        return capabilityEntries.find((entry) => entry.id === capabilityId)
      },
      register(capability, handler, registerOptions) {
        const ownedCapability: ActiveLaneCapabilityRecord = {
          ...capability,
          extensionId: capability.extensionId ?? defaultExtensionId,
          source: registerOptions?.source ?? 'runtime',
        }
        const existingIndex = capabilityEntries.findIndex(
          (entry) => entry.id === ownedCapability.id,
        )
        if (existingIndex >= 0) capabilityEntries.splice(existingIndex, 1, ownedCapability)
        else capabilityEntries.push(ownedCapability)
        capabilityHandlers.set(ownedCapability.id, {
          handler: handler as ActiveLaneCapabilityHandler | undefined,
        })
        capabilityEntries.sort((left, right) => left.title.localeCompare(right.title))
        return {
          dispose() {
            const index = capabilityEntries.findIndex((entry) => entry.id === ownedCapability.id)
            if (index >= 0) capabilityEntries.splice(index, 1)
            capabilityHandlers.delete(ownedCapability.id)
          },
        }
      },
      async invoke<TResult = unknown, TInput = unknown>(
        capabilityId: string,
        input?: TInput,
        callerExtensionId?: string,
      ): Promise<TResult> {
        const capability = capabilityEntries.find((entry) => entry.id === capabilityId)
        if (!capability) throw new Error(`Unknown capability: ${capabilityId}`)
        const registered = capabilityHandlers.get(capabilityId)
        if (!registered?.handler) {
          throw new Error(`Capability ${capabilityId} is registered without an invocation handler.`)
        }
        return (await registered.handler({
          capability,
          input,
          callerExtensionId,
        })) as TResult
      },
    }
  }

  function registerManifestCapabilities(definition: WorkbenchExtensionDefinition) {
    const capabilities = [
      ...(definition.manifest.capabilities ?? []),
      ...(definition.manifest.contributes?.capabilities ?? []),
    ].filter((capability) => capability.availability !== 'server')
    if (!capabilities.length) return undefined
    const disposables = capabilities.map((capability) =>
      createCapabilityService(definition.manifest.id).register(
        {
          ...capability,
          extensionId: capability.extensionId ?? definition.manifest.id,
        },
        undefined,
        { source: 'manifest' },
      ),
    )
    return {
      dispose() {
        disposables.forEach((item) => {
          item.dispose()
        })
      },
    } satisfies Disposable
  }

  function trackDynamic(dynamicDisposables: Disposable[], disposable: Disposable) {
    dynamicDisposables.push(disposable)
    return disposable
  }

  function schedulePersist() {
    if (persistence.timeoutId) globalThis.clearTimeout(persistence.timeoutId)
    persistence.timeoutId = globalThis.setTimeout(() => {
      void shell.persist()
      persistence.timeoutId = null
    }, 120) as unknown as number
  }

  function reportSurfaceError(
    extensionId: string,
    error: {
      surface: 'tab' | 'sidebar' | 'inspector' | 'command' | 'extension'
      contributionId?: string
      message: string
    },
  ) {
    const record = records.find((item) => item.extensionId === extensionId)
    if (!record) return
    const timestamp = new Date().toISOString()
    const existing = record.surfaceErrors.find(
      (item) => item.surface === error.surface && item.contributionId === error.contributionId,
    )
    if (existing) {
      existing.message = error.message
      existing.timestamp = timestamp
    } else {
      record.surfaceErrors.push({
        surface: error.surface,
        contributionId: error.contributionId,
        message: error.message,
        timestamp,
      })
    }
    refreshRecordStatus(record)
  }

  function clearSurfaceErrors(extensionId: string, contributionId?: string) {
    const record = records.find((item) => item.extensionId === extensionId)
    if (!record) return
    record.surfaceErrors = contributionId
      ? record.surfaceErrors.filter((item) => item.contributionId !== contributionId)
      : []
    refreshRecordStatus(record)
  }

  function findTabForAction(tabId: string, groupId?: string) {
    const queue = [shell.state.layout]
    while (queue.length) {
      const node = queue.shift()
      if (!node) continue
      if (node.kind === 'split') {
        queue.push(...node.children)
        continue
      }
      if (groupId && node.id !== groupId) continue
      const tab = node.tabs.find((item) => item.id === tabId)
      if (tab) return { group: node, tab }
    }
    return null
  }

  function findTabGroupForAction(tabGroupId: string, groupId?: string) {
    const queue = [shell.state.layout]
    while (queue.length) {
      const node = queue.shift()
      if (!node) continue
      if (node.kind === 'split') {
        queue.push(...node.children)
        continue
      }
      if (groupId && node.id !== groupId) continue
      const tabGroup = node.tabGroups.find((item) => item.id === tabGroupId)
      if (tabGroup) return { group: node, tabGroup }
    }
    return null
  }

  function createCollectionService<TItem extends WorkbenchTabSession | WorkbenchTabTemplate>(
    key: 'tab-sessions' | 'tab-templates',
    schema: TItem['schema'],
    prefix: string,
    defaultName: string,
  ): WorkbenchTabCollectionService<TItem> {
    const items = reactivity.reactive<TItem[]>([])
    const collectionStorage =
      host.capabilities.storage?.scope(`workbench.${key}`) ?? createMemoryStorageScope()

    async function load() {
      const persisted = (await collectionStorage.get<TItem[]>(key)) ?? []
      items.splice(0, items.length, ...persisted.filter((item) => item.schema === schema))
    }

    async function saveAll() {
      await collectionStorage.set(key, JSON.parse(JSON.stringify(items)))
    }

    void load()

    return {
      list: () => [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      async saveCurrent(name = defaultName) {
        const now = new Date().toISOString()
        const item = {
          schema,
          version: 1,
          id: createTabWorkspaceId(prefix),
          name,
          createdAt: now,
          updatedAt: now,
          workspace: shell.tabs.serializeWorkspace(),
        } as TItem
        items.unshift(item)
        await saveAll()
        return item
      },
      async save(item) {
        const index = items.findIndex((candidate) => candidate.id === item.id)
        if (index >= 0) items.splice(index, 1, item)
        else items.unshift(item)
        await saveAll()
        return item
      },
      get: (id) => items.find((item) => item.id === id),
      async rename(id, name) {
        const item = items.find((candidate) => candidate.id === id)
        if (!item) return undefined
        item.name = name.trim() || item.name
        item.updatedAt = new Date().toISOString()
        await saveAll()
        return item
      },
      async duplicate(id, name) {
        const item = items.find((candidate) => candidate.id === id)
        if (!item) return undefined
        const now = new Date().toISOString()
        const duplicate = {
          ...JSON.parse(JSON.stringify(item)),
          id: createTabWorkspaceId(prefix),
          name: name?.trim() || `${item.name} Copy`,
          createdAt: now,
          updatedAt: now,
        } as TItem
        items.unshift(duplicate)
        await saveAll()
        return duplicate
      },
      async delete(id) {
        const index = items.findIndex((candidate) => candidate.id === id)
        if (index < 0) return false
        items.splice(index, 1)
        await saveAll()
        return true
      },
      exportJson(id) {
        const item = items.find((candidate) => candidate.id === id)
        return item ? JSON.stringify(item, null, 2) : undefined
      },
      async importJson(json) {
        const item = parseWorkbenchTabPayload<TItem>(json, schema)
        const now = new Date().toISOString()
        const imported = {
          ...item,
          id: item.id || createTabWorkspaceId(prefix),
          updatedAt: now,
          createdAt: item.createdAt || now,
        } as TItem
        const index = items.findIndex((candidate) => candidate.id === imported.id)
        if (index >= 0) items.splice(index, 1, imported)
        else items.unshift(imported)
        await saveAll()
        return imported
      },
      apply(id, options) {
        const item = items.find((candidate) => candidate.id === id)
        if (item) shell.tabs.applyWorkspace(item.workspace, options)
      },
    }
  }

  let runtime: WorkbenchRuntimeApi

  async function executeCommand(commandId: string) {
    const command = registry.commands.find((item) => item.id === commandId)
    if (!command?.run || command.enabled === false || command.visible === false) return
    const context: WorkbenchCommandExecutionContext = {
      runtime,
      host,
      workbench,
    }
    try {
      await command.run(context)
      if (command.ownerExtensionId) clearSurfaceErrors(command.ownerExtensionId, command.id)
    } catch (error) {
      if (command.ownerExtensionId) {
        reportSurfaceError(command.ownerExtensionId, {
          surface: 'command',
          contributionId: command.id,
          message: error instanceof Error ? error.message : String(error),
        })
      }
      throw error
    }
  }

  const fileOpeners: FileOpenerService = {
    register(opener, registerOptions) {
      const ownerExtensionId =
        registerOptions?.source === 'extension' ? registerOptions.extensionId : undefined
      const contribution = {
        ...opener,
        ownerExtensionId: opener.ownerExtensionId ?? ownerExtensionId,
      }
      const existingIndex = registry.fileOpeners.findIndex((item) => item.id === contribution.id)
      if (existingIndex >= 0) registry.fileOpeners.splice(existingIndex, 1, contribution)
      else registry.fileOpeners.push(contribution)
      return {
        dispose() {
          const index = registry.fileOpeners.findIndex((item) => item.id === contribution.id)
          if (index >= 0) registry.fileOpeners.splice(index, 1)
        },
      }
    },
    list() {
      return [...registry.fileOpeners]
    },
    resolve(intent) {
      const systemOpeners = [
        {
          id: 'system.default',
          label: 'System Default',
          description:
            host.kind === 'desktop'
              ? 'Open with the operating system default application.'
              : 'Native file opening is only available in the desktop host.',
          source: 'system' as const,
          appId: 'default',
          priority: host.capabilities.files?.openPath ? 120 : -10,
          recommended: false,
        },
      ]
      return resolveFileOpeners(intent, registry.fileOpeners, {
        systemOpeners,
      })
    },
    async getPreferred(intent) {
      const key = preferenceKeyForFileOpenIntent(intent)
      return key ? fileOpenerStorage.get<string>(key) : undefined
    },
    async setPreferred(intent, openerId) {
      const key = preferenceKeyForFileOpenIntent(intent)
      if (!key) return
      if (openerId) await fileOpenerStorage.set(key, openerId)
      else await fileOpenerStorage.remove(key)
    },
    async open(intent: FileOpenIntent, openerId?: string) {
      const preferred = openerId ?? (await fileOpeners.getPreferred(intent))
      const systemOpeners =
        (await host.capabilities.files?.listSystemFileOpeners?.(intent.filePath))?.map(
          (opener) => ({
            id: opener.id,
            label: opener.label,
            description: opener.description,
            source: 'system' as const,
            appId: opener.appId ?? opener.id.replace(/^system\./, ''),
            executablePath: opener.executablePath,
            priority: opener.priority ?? 100,
            recommended: false,
          }),
        ) ?? []
      const openers = resolveFileOpeners(intent, registry.fileOpeners, {
        preferredOpenerId: preferred,
        systemOpeners: [
          {
            id: 'system.default',
            label: 'System Default',
            description: 'Open with the operating system default application.',
            source: 'system',
            appId: 'default',
            priority: 120,
            recommended: false,
          },
          ...systemOpeners,
        ],
      })
      const opener = preferred
        ? openers.find((candidate) => candidate.id === preferred)
        : openers[0]
      if (!opener) return 'fallback'
      if (opener.source === 'system') {
        if (opener.id === 'system.default' || opener.appId === 'default') {
          if (!host.capabilities.files?.openPath) return 'unavailable'
          await host.capabilities.files.openPath(intent.filePath)
          return 'opened'
        }
        if (!opener.appId || !host.capabilities.files?.openWithSystemApp) return 'unavailable'
        await host.capabilities.files.openWithSystemApp(intent.filePath, opener.appId)
        return 'opened'
      }
      if (!opener.command) return 'fallback'
      await executeCommand(opener.command)
      return 'opened'
    },
  }

  const commandSearch = createCommandSearchService({
    registry,
    settings,
    extensions: {
      getRecord(extensionId) {
        return records.find((item) => item.extensionId === extensionId)
      },
    },
    execute: executeCommand,
  })

  const sessionService = createCollectionService<WorkbenchTabSession>(
    'tab-sessions',
    'activelane.workbench.tabs.session',
    'tab-session',
    'Current Workspace Session',
  )
  const templateService = createCollectionService<WorkbenchTabTemplate>(
    'tab-templates',
    'activelane.workbench.tabs.template',
    'tab-template',
    'Workspace Template',
  )
  workbench.tabs = {
    ...shell.tabs,
    sessions: sessionService,
    templates: templateService,
    sharing: {
      ...shell.tabs.sharing,
      createFromWorkspace(name = 'Shared Tab Set'): WorkbenchSharedTabSet {
        return {
          schema: 'activelane.workbench.tabs.shared-set',
          version: 1,
          id: createTabWorkspaceId('shared-tab-set'),
          name,
          source: 'workspace',
          createdAt: new Date().toISOString(),
          workspace: shell.tabs.serializeWorkspace(),
        }
      },
      importPayload(payload) {
        return parseWorkbenchTabPayload<WorkbenchSharedTabSet>(
          payload,
          'activelane.workbench.tabs.shared-set',
        )
      },
      apply(set, options?: WorkbenchWorkspaceApplyOptions) {
        shell.tabs.applyWorkspace(set.workspace, options)
      },
    },
    async runTabAction(actionId, tabId, groupId) {
      const located = findTabForAction(tabId, groupId)
      if (!located) return false
      const action = shell.tabs
        .getTabActions(located.tab, located.group.id)
        .find((item) => item.id === actionId)
      if (!action) return false
      const context = { runtime, host, workbench, tab: located.tab, groupId: located.group.id }
      if (action.visible === false || action.enabled === false) return false
      if (typeof action.visible === 'function' && !action.visible(context)) return false
      if (typeof action.enabled === 'function' && !action.enabled(context)) return false
      try {
        await action.run(context)
        if (action.ownerExtensionId) clearSurfaceErrors(action.ownerExtensionId, action.id)
        return true
      } catch (error) {
        if (action.ownerExtensionId) {
          reportSurfaceError(action.ownerExtensionId, {
            surface: 'command',
            contributionId: action.id,
            message: error instanceof Error ? error.message : String(error),
          })
        }
        await host.capabilities.notify?.({
          title: 'Tab action failed',
          message: error instanceof Error ? error.message : String(error),
          tone: 'error',
        })
        return false
      }
    },
    async runTabGroupAction(actionId, tabGroupId, groupId) {
      const located = findTabGroupForAction(tabGroupId, groupId)
      if (!located) return false
      const action = shell.tabs
        .getTabGroupActions(located.tabGroup, located.group.id)
        .find((item) => item.id === actionId)
      if (!action) return false
      const context = {
        runtime,
        host,
        workbench,
        tabGroup: located.tabGroup,
        groupId: located.group.id,
        tabs: located.group.tabs.filter((tab) => tab.tabGroupId === located.tabGroup.id),
      }
      if (action.visible === false || action.enabled === false) return false
      if (typeof action.visible === 'function' && !action.visible(context)) return false
      if (typeof action.enabled === 'function' && !action.enabled(context)) return false
      try {
        await action.run(context)
        if (action.ownerExtensionId) clearSurfaceErrors(action.ownerExtensionId, action.id)
        return true
      } catch (error) {
        if (action.ownerExtensionId) {
          reportSurfaceError(action.ownerExtensionId, {
            surface: 'command',
            contributionId: action.id,
            message: error instanceof Error ? error.message : String(error),
          })
        }
        await host.capabilities.notify?.({
          title: 'Tab group action failed',
          message: error instanceof Error ? error.message : String(error),
          tone: 'error',
        })
        return false
      }
    },
  }

  runtime = {
    context,
    host,
    workbench,
    themes,
    settings,
    fileOpeners,
    capabilities: rootCapabilities,
    explorer,
    registry,
    extensions: {
      records,
      discovered,
      async install(extensionId: string, version?: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        const definition = definitions.get(extensionId)
        const installed = await host.capabilities.extensions?.install?.(extensionId, version)
        if (installed) upsertInstalledRecord(installed)
        if (!record || !definition) return
        if (
          isExperimentalExtension(definition) &&
          settings.get<boolean>('workbench.extensions.allowExperimental') !== true
        ) {
          throw new Error('Experimental extensions are disabled in Workbench Settings.')
        }
        record.installed = true
        record.enabled = true
        refreshRecordStatus(record)
        await runtime.extensions.activate(extensionId)
      },
      async installFromPackage(packageBytes: ArrayBuffer | Uint8Array) {
        const installed = await host.capabilities.extensions?.installFromPackage?.(packageBytes)
        if (installed) {
          upsertInstalledRecord(installed)
          const record = records.find((item) => item.extensionId === installed.extensionId)
          if (record) {
            record.installed = true
            record.enabled = installed.enabled
            refreshRecordStatus(record)
            if (record.enabled) await runtime.extensions.activate(record.extensionId)
          }
        }
      },
      async uninstall(extensionId: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        if (!record) return
        const wasActive = record.active
        await runtime.extensions.deactivate(extensionId)
        try {
          await host.capabilities.extensions?.uninstall?.(extensionId)
        } catch (error) {
          if (wasActive) await runtime.extensions.activate(extensionId)
          throw error
        }
        record.installed = false
        record.enabled = false
        record.active = false
        record.error = undefined
        record.surfaceErrors = []
        refreshRecordStatus(record)
        removeInstalledRecord(extensionId)
      },
      async enable(extensionId: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        const definition = definitions.get(extensionId)
        if (
          definition &&
          isExperimentalExtension(definition) &&
          settings.get<boolean>('workbench.extensions.allowExperimental') !== true
        ) {
          throw new Error('Experimental extensions are disabled in Workbench Settings.')
        }
        const installed = await host.capabilities.extensions?.enable?.(extensionId)
        if (installed) upsertInstalledRecord(installed)
        if (!record) return
        record.enabled = true
        refreshRecordStatus(record)
        if (record.installed) {
          await runtime.extensions.activate(extensionId)
          if (!record.active) {
            const activationError = record.error ?? `Failed to activate ${extensionId}.`
            const disabled = await host.capabilities.extensions?.disable?.(extensionId)
            if (disabled) upsertInstalledRecord(disabled)
            record.enabled = false
            refreshRecordStatus(record)
            throw new Error(activationError)
          }
        }
      },
      async disable(extensionId: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        if (!record) return
        const wasActive = record.active
        await runtime.extensions.deactivate(extensionId)
        let installed: InstalledExtensionRecord | undefined
        try {
          installed = await host.capabilities.extensions?.disable?.(extensionId)
        } catch (error) {
          if (wasActive) await runtime.extensions.activate(extensionId)
          throw error
        }
        record.enabled = false
        if (installed) upsertInstalledRecord(installed)
        refreshRecordStatus(record)
      },
      async listInstalled() {
        const latest = (await host.capabilities.extensions?.listInstalled?.()) ?? installedRecords
        installedRecords.splice(0, installedRecords.length, ...latest)
        return latest
      },
      async activate(extensionId: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        const definition = definitions.get(extensionId)
        if (!record || !definition || !record.installed || !record.enabled || record.active) return

        const registrar = createRegistrar(extensionId)
        const dynamicDisposables: Disposable[] = []
        const context: WorkbenchExtensionContext = {
          extensionId,
          manifest: definition.manifest,
          host,
          storage:
            host.capabilities.storage?.scope(`extension:${extensionId}`) ??
            createMemoryStorageScope(),
          workbench,
          commands: runtime.commands,
          capabilities: createCapabilityService(extensionId),
          explorer,
          runtime: runtime as WorkbenchRuntimeApi,
          contribute: {
            activityRail: (...items: WorkbenchActivityContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.activityRail(...items)),
            apps: (...items: WorkbenchApplicationContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.apps(...items)),
            parts: (...items: WorkbenchPartContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.parts(...items)),
            statusBar: (...items: WorkbenchStatusBarItemContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.statusBar(...items)),
            globalMenus: (...items: WorkbenchGlobalMenuContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.globalMenus(...items)),
            sidebarViews: (...items: WorkbenchSidebarViewContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.sidebarViews(...items)),
            commands: (...items: WorkbenchCommandContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.commands(...items)),
            commandPalette: (...items: WorkbenchCommandPaletteContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.commandPalette(...items)),
            tabRenderers: (...items: WorkbenchTabRendererContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.tabRenderers(...items)),
            tabSurfaces: (...items: WorkbenchTabSurfaceContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.tabSurfaces(...items)),
            tabToolbarActions: (...items: WorkbenchActionContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.tabToolbarActions(...items)),
            tabContextMenu: (...items: WorkbenchMenuItemContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.tabContextMenu(...items)),
            bottomPaneViews: (...items: WorkbenchBottomPaneContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.bottomPaneViews(...items)),
            inspectorPanels: (...items: WorkbenchInspectorPanelContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.inspectorPanels(...items)),
            settingsPages: (...items: WorkbenchSettingsPageContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.settingsPages(...items)),
            settings: (contribution: WorkbenchSettingsContribution) =>
              trackDynamic(dynamicDisposables, registrar.settings(contribution)),
            menus: (...items: WorkbenchMenuItemContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.menus(...items)),
            fileOpeners: (...items: FileOpenerContribution[]) =>
              trackDynamic(dynamicDisposables, registrar.fileOpeners(...items)),
            tabActions: (...items: WorkbenchRegisteredTabAction[]) =>
              trackDynamic(dynamicDisposables, registrar.tabActions(...items)),
            tabGroupActions: (...items: WorkbenchRegisteredTabGroupAction[]) =>
              trackDynamic(dynamicDisposables, registrar.tabGroupActions(...items)),
          },
        }

        const manifestContributions = definition.manifest.contributes
        if (manifestContributions?.activityRail?.length) {
          dynamicDisposables.push(registrar.activityRail(...manifestContributions.activityRail))
        }
        if (manifestContributions?.apps?.length) {
          dynamicDisposables.push(registrar.apps(...manifestContributions.apps))
        }
        if (manifestContributions?.parts?.length) {
          dynamicDisposables.push(registrar.parts(...manifestContributions.parts))
        }
        if (manifestContributions?.statusBar?.length) {
          dynamicDisposables.push(registrar.statusBar(...manifestContributions.statusBar))
        }
        const applicationMenus = [
          ...(manifestContributions?.applicationMenus ?? []),
          ...(manifestContributions?.globalMenus ?? []),
        ]
        if (applicationMenus.length) {
          dynamicDisposables.push(registrar.globalMenus(...applicationMenus))
        }
        if (manifestContributions?.sidebarViews?.length) {
          dynamicDisposables.push(registrar.sidebarViews(...manifestContributions.sidebarViews))
        }
        if (manifestContributions?.commands?.length) {
          dynamicDisposables.push(registrar.commands(...manifestContributions.commands))
        }
        if (manifestContributions?.commandPalette?.length) {
          dynamicDisposables.push(registrar.commandPalette(...manifestContributions.commandPalette))
        }
        if (manifestContributions?.tabRenderers?.length) {
          dynamicDisposables.push(registrar.tabRenderers(...manifestContributions.tabRenderers))
        }
        if (manifestContributions?.tabSurfaces?.length) {
          dynamicDisposables.push(registrar.tabSurfaces(...manifestContributions.tabSurfaces))
        }
        if (manifestContributions?.tabToolbarActions?.length) {
          dynamicDisposables.push(
            registrar.tabToolbarActions(...manifestContributions.tabToolbarActions),
          )
        }
        if (manifestContributions?.tabContextMenu?.length) {
          dynamicDisposables.push(registrar.tabContextMenu(...manifestContributions.tabContextMenu))
        }
        if (manifestContributions?.bottomPaneViews?.length) {
          dynamicDisposables.push(
            registrar.bottomPaneViews(...manifestContributions.bottomPaneViews),
          )
        }
        if (manifestContributions?.inspectorPanels?.length) {
          dynamicDisposables.push(
            registrar.inspectorPanels(...manifestContributions.inspectorPanels),
          )
        }
        if (manifestContributions?.settingsPages?.length) {
          dynamicDisposables.push(registrar.settingsPages(...manifestContributions.settingsPages))
        }
        if (manifestContributions?.settings?.length) {
          dynamicDisposables.push(
            registrar.settings({
              ...normalizeManifestSettings(manifestContributions.settings),
              ownerExtensionId: extensionId,
              ownerExtensionName: definition.manifest.displayName,
              category: 'Extensions',
            }),
          )
        }
        if (manifestContributions?.menus?.length) {
          dynamicDisposables.push(registrar.menus(...manifestContributions.menus))
        }
        if (manifestContributions?.fileOpeners?.length) {
          dynamicDisposables.push(registrar.fileOpeners(...manifestContributions.fileOpeners))
        }
        if (manifestContributions?.themes?.length) {
          dynamicDisposables.push(themes.register(extensionId, manifestContributions.themes))
        }
        const manifestCapabilityDisposable = registerManifestCapabilities(definition)
        if (manifestCapabilityDisposable) dynamicDisposables.push(manifestCapabilityDisposable)

        try {
          record.error = undefined
          clearSurfaceErrors(extensionId)
          const disposable = (await definition.activate?.(context)) ?? undefined
          extensionState.set(extensionId, { disposable, dynamicDisposables })
          record.active = true
          refreshRecordStatus(record)
          if (!shell.state.activeActivityId && registry.activityRail[0]) {
            shell.setActiveActivity(registry.activityRail[0].id)
          }
        } catch (error) {
          record.active = false
          record.error = error instanceof Error ? error.message : String(error)
          refreshRecordStatus(record)
        }
      },
      async deactivate(extensionId: string) {
        const record = records.find((item) => item.extensionId === extensionId)
        const definition = definitions.get(extensionId)
        if (!record || !definition) return
        await definition.deactivate?.({
          extensionId,
          manifest: definition.manifest,
          host,
          storage:
            host.capabilities.storage?.scope(`extension:${extensionId}`) ??
            createMemoryStorageScope(),
          workbench,
          commands: runtime.commands,
          capabilities: createCapabilityService(extensionId),
          explorer,
          runtime: runtime as WorkbenchRuntimeApi,
          contribute: createRegistrar(extensionId),
        })
        const active = extensionState.get(extensionId)
        active?.dynamicDisposables.forEach((item) => {
          item.dispose()
        })
        active?.disposable?.dispose?.()
        extensionState.delete(extensionId)
        record.active = false
        refreshRecordStatus(record)
      },
      reportSurfaceError,
      clearSurfaceErrors,
      getRecord(extensionId: string) {
        return records.find((item) => item.extensionId === extensionId)
      },
    },
    commands: {
      execute: executeCommand,
      search: commandSearch,
    },
  } satisfies WorkbenchRuntimeApi

  registry.commands.push({
    id: 'workbench.action.openSettings',
    title: 'Open Settings',
    category: 'Workbench',
    shortcut: 'mod+,',
    run: ({ workbench }) => {
      workbench.openTab({
        id: 'workbench.settings',
        kind: 'workbench.settings',
        title: 'Settings',
        closable: true,
        pinned: false,
        preview: false,
      })
    },
  })
  registry.commands.push(
    {
      id: 'workbench.bottomPane.open',
      title: 'Workbench: Open Bottom Pane',
      category: 'Workbench',
      run: ({ runtime, workbench }) => {
        const activeViewId =
          workbench.state.bottomPanel.activeViewId ??
          runtime.registry.bottomPaneViews[0]?.id ??
          null
        if (activeViewId) workbench.setActiveBottomPanelView(activeViewId)
        else workbench.setBottomPanelOpen(true)
      },
    },
    {
      id: 'workbench.bottomPane.close',
      title: 'Workbench: Close Bottom Pane',
      category: 'Workbench',
      run: ({ workbench }) => workbench.setBottomPanelOpen(false),
    },
    {
      id: 'workbench.bottomPane.toggle',
      title: 'Workbench: Toggle Bottom Pane',
      category: 'Workbench',
      run: ({ runtime, workbench }) => {
        if (workbench.state.bottomPanel.open) {
          workbench.setBottomPanelOpen(false)
          return
        }
        const activeViewId =
          workbench.state.bottomPanel.activeViewId ??
          runtime.registry.bottomPaneViews[0]?.id ??
          null
        if (activeViewId) workbench.setActiveBottomPanelView(activeViewId)
        else workbench.setBottomPanelOpen(true)
      },
    },
    {
      id: 'workbench.bottomPane.focusView',
      title: 'Workbench: Focus Bottom Pane View',
      category: 'Workbench',
      run: ({ runtime, workbench }) => {
        const activeViewId =
          workbench.state.bottomPanel.activeViewId ??
          runtime.registry.bottomPaneViews[0]?.id ??
          null
        if (activeViewId) workbench.setActiveBottomPanelView(activeViewId)
      },
    },
  )
  registry.commandPalette.push({
    id: 'workbench.commandPalette.openSettings',
    commandId: 'workbench.action.openSettings',
    title: 'Open Settings',
    category: 'Workbench',
    keywords: ['preferences', 'configure', 'keyboard shortcuts'],
  })

  function registerDefinition(entry: WorkbenchExtensionCatalogEntry) {
    definitions.set(entry.definition.manifest.id, entry.definition)
    discovered.push(entry)
    const installed = installedRecords.find(
      (item) => item.extensionId === entry.definition.manifest.id,
    )
    const record: WorkbenchRuntimeExtensionRecord = {
      extensionId: entry.definition.manifest.id,
      manifest: entry.definition.manifest,
      installed: installed ? true : (entry.definition.manifest.builtin ?? false),
      enabled: installed ? installed.enabled : (entry.definition.manifest.builtin ?? false),
      active: false,
      status: installed || entry.definition.manifest.builtin ? 'installed' : 'discovered',
      surfaceErrors: [],
    }
    records.push(record)
    const extensionKind = (entry.definition.manifest as { extensionKind?: string[] }).extensionKind
    if (
      entry.definition.manifest.server ||
      entry.definition.manifest.type === 'server' ||
      entry.definition.manifest.type === 'hybrid' ||
      extensionKind?.includes('server')
    ) {
      try {
        const serverExtension = host.server.registerExtension({
          manifest: entry.definition.manifest,
          server: entry.definition.manifest.server,
        })
        if (record.installed && record.enabled && serverExtension.declaration.startup === 'auto') {
          void host.server.startServer(serverExtension.id)
        }
      } catch (error) {
        record.error = error instanceof Error ? error.message : String(error)
        refreshRecordStatus(record)
      }
    }
  }

  function upsertInstalledRecord(record: InstalledExtensionRecord) {
    const index = installedRecords.findIndex((item) => item.extensionId === record.extensionId)
    if (index >= 0) installedRecords.splice(index, 1, record)
    else installedRecords.push(record)
  }

  function removeInstalledRecord(extensionId: string) {
    const index = installedRecords.findIndex((item) => item.extensionId === extensionId)
    if (index >= 0) installedRecords.splice(index, 1)
  }

  options.extensions?.forEach(registerDefinition)

  for (const record of records) {
    const activationEvents = record.manifest.activationEvents ?? ['onStartup']
    if (record.installed && record.enabled && activationEvents.includes('onStartup')) {
      await runtime.extensions.activate(record.extensionId)
    }
  }

  reactivity.watch?.(
    () => shell.state,
    () => {
      schedulePersist()
    },
    { deep: true },
  )

  return runtime
}

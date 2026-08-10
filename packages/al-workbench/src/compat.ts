import type {
  ActiveLaneCapabilityHandler,
  ActiveLaneCapabilityRecord,
  ActiveLaneCapabilityService,
  Disposable,
  ExplorerRuntime,
  FileOpenerContribution,
  WorkbenchActionContribution,
  WorkbenchActivityContribution,
  WorkbenchBottomPaneContribution,
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
  WorkbenchGlobalMenuContribution,
  WorkbenchHostAdapter,
  WorkbenchHostMode,
  WorkbenchInspectorPanelContribution,
  WorkbenchMenuItemContribution,
  WorkbenchPartContribution,
  WorkbenchRegisteredContributions,
  WorkbenchRuntimeApi,
  WorkbenchRuntimeExtensionRecord,
  WorkbenchSettingDefinition,
  WorkbenchSettingsContribution,
  WorkbenchSettingsInspection,
  WorkbenchSettingsPageContribution,
  WorkbenchSettingsService,
  WorkbenchShellApi,
  WorkbenchShellState,
  WorkbenchSidebarViewContribution,
  WorkbenchStatusBarItemContribution,
  WorkbenchTabRendererContribution,
  WorkbenchTabSurfaceContribution,
  WorkbenchThemeContribution,
  WorkbenchThemePreference,
  WorkbenchThemeService,
} from '@activelane/workbench-api'
import {
  createCommandSearchService,
  createRuntimeContext,
  createWorkbenchStore as createRuntimeWorkbenchStore,
  normalizeWorkbenchContribution,
} from '@activelane/workbench-api'
import { markRaw, reactive } from 'vue'

type ContributionKey = keyof WorkbenchRegisteredContributions
type RegistrableContribution = WorkbenchRegisteredContributions[ContributionKey][number]
type LegacyActivityContribution = WorkbenchActivityContribution & {
  sidebarViewId?: string
}
type LegacyTabRendererContribution = Omit<
  WorkbenchTabRendererContribution,
  'id' | 'title' | 'tabKind'
> & {
  id?: string
  title?: string
  kind?: string
  tabKind?: string
}

export interface LegacyWorkbenchRegistry extends WorkbenchRegisteredContributions {
  registerPart(item: WorkbenchPartContribution): Disposable
  registerStatusBarItem(item: WorkbenchStatusBarItemContribution): Disposable
  registerGlobalMenu(item: WorkbenchGlobalMenuContribution): Disposable
  registerActivityItem(item: LegacyActivityContribution): Disposable
  registerSidebarView(item: WorkbenchSidebarViewContribution): Disposable
  registerTabRenderer(item: LegacyTabRendererContribution): Disposable
  registerTabSurface(item: WorkbenchTabSurfaceContribution): Disposable
  registerCommand(item: WorkbenchCommandContribution): Disposable
  registerCommandPaletteItem(item: WorkbenchCommandPaletteContribution): Disposable
  registerTabToolbarAction(item: WorkbenchActionContribution): Disposable
  registerTabContextMenuItem(item: WorkbenchMenuItemContribution): Disposable
  registerBottomPaneView(item: WorkbenchBottomPaneContribution): Disposable
  registerInspectorPanel(item: WorkbenchInspectorPanelContribution): Disposable
  registerSettingsPage(item: WorkbenchSettingsPageContribution): Disposable
  registerMenuItem(item: WorkbenchMenuItemContribution): Disposable
  registerFileOpener(item: FileOpenerContribution): Disposable
}

export interface LegacyWorkbenchStoreOptions {
  hostMode?: WorkbenchHostMode | 'browser-extension'
  state?: Partial<WorkbenchShellState> & {
    sidebarWidth?: number
    sidebarCollapsed?: boolean
  }
}

function removeByIdentity<T>(items: T[], item: T) {
  const index = items.indexOf(item)
  if (index >= 0) items.splice(index, 1)
}

function registerItem<T extends RegistrableContribution>(
  registry: WorkbenchRegisteredContributions,
  key: ContributionKey,
  item: T,
): Disposable {
  const normalized = normalizeWorkbenchContribution(
    key,
    item as never,
    markRaw as <T>(value: T) => T,
  ) as T
  ;(registry[key] as T[]).push(normalized)
  return {
    dispose() {
      removeByIdentity(registry[key] as T[], normalized)
    },
  }
}

function createMemoryHost(mode: WorkbenchHostMode): WorkbenchHostAdapter {
  const namespaces = new Map<string, Map<string, unknown>>()

  return {
    id: 'legacy-workbench',
    kind: mode === 'compact' ? 'browser-extension' : 'webapp',
    label: 'Legacy Workbench',
    mode,
    capabilities: {
      storage: {
        scope(namespace) {
          let values = namespaces.get(namespace)
          if (!values) {
            values = new Map<string, unknown>()
            namespaces.set(namespace, values)
          }

          return {
            async get<T>(key: string) {
              return values?.get?.(key) as T | undefined
            },
            async set<T>(key: string, value: T) {
              values?.set?.(key, value)
            },
            async remove(key: string) {
              values?.delete?.(key)
            },
          }
        },
      },
    },
  }
}

export function createWorkbenchRegistry(): LegacyWorkbenchRegistry {
  const contributions = reactive<WorkbenchRegisteredContributions>({
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

  const registry: LegacyWorkbenchRegistry = reactive({
    ...contributions,
    parts: contributions.parts,
    registerPart: (item: WorkbenchPartContribution) => registerItem(registry, 'parts', item),
    registerStatusBarItem: (item: WorkbenchStatusBarItemContribution) =>
      registerItem(registry, 'statusBar', item),
    registerGlobalMenu: (item: WorkbenchGlobalMenuContribution) =>
      registerItem(registry, 'globalMenus', item),
    registerActivityItem: (item) =>
      registerItem(registry, 'activityRail', {
        ...item,
        defaultSidebarViewId: item.defaultSidebarViewId ?? item.sidebarViewId,
      }),
    apps: contributions.apps,
    registerSidebarView: (item) => registerItem(registry, 'sidebarViews', item),
    registerTabRenderer: (item) =>
      registerItem(registry, 'tabRenderers', {
        ...item,
        id: item.id ?? item.kind ?? item.tabKind ?? 'tab-renderer',
        title: item.title ?? item.kind ?? item.tabKind ?? 'Tab renderer',
        tabKind: item.tabKind ?? item.kind ?? item.id ?? 'unknown',
      }),
    registerTabSurface: (item) => registerItem(registry, 'tabSurfaces', item),
    registerCommand: (item) => registerItem(registry, 'commands', item),
    registerCommandPaletteItem: (item) => registerItem(registry, 'commandPalette', item),
    registerTabToolbarAction: (item) => registerItem(registry, 'tabToolbarActions', item),
    registerTabContextMenuItem: (item) => registerItem(registry, 'tabContextMenu', item),
    registerBottomPaneView: (item) => registerItem(registry, 'bottomPaneViews', item),
    registerInspectorPanel: (item) => registerItem(registry, 'inspectorPanels', item),
    registerSettingsPage: (item) => registerItem(registry, 'settingsPages', item),
    registerMenuItem: (item) => registerItem(registry, 'menus', item),
    registerFileOpener: (item) => registerItem(registry, 'fileOpeners', item),
  })

  return registry
}

export function createWorkbenchStore(options: LegacyWorkbenchStoreOptions = {}): WorkbenchShellApi {
  const hostMode =
    options.hostMode === 'browser-extension' ? 'compact' : (options.hostMode ?? 'standard')
  const legacyState = options.state ?? {}
  const state: Partial<WorkbenchShellState> = {
    ...legacyState,
    hostMode,
    sidebar: {
      collapsed: legacyState.sidebarCollapsed ?? legacyState.sidebar?.collapsed ?? false,
      size: legacyState.sidebarWidth ?? legacyState.sidebar?.size ?? 320,
      minSize: legacyState.sidebar?.minSize ?? 220,
      minExpandedSize: legacyState.sidebar?.minExpandedSize ?? 220,
      lastExpandedSize: legacyState.sidebar?.lastExpandedSize ?? legacyState.sidebarWidth ?? 320,
      collapseThreshold: legacyState.sidebar?.collapseThreshold ?? 96,
      maxSize: legacyState.sidebar?.maxSize ?? 520,
    },
  }

  return createRuntimeWorkbenchStore(createMemoryHost(hostMode), state)
}

function createMemoryThemeService(): WorkbenchThemeService {
  const themes = reactive<WorkbenchThemeContribution[]>([])
  let preference: WorkbenchThemePreference = 'system'
  return {
    list: () => themes,
    get: (themeId) => themes.find((theme) => theme.id === themeId),
    getPreference: () => preference,
    getActiveTheme: () => themes[0],
    getSystemTheme: () => 'light',
    resolvePreference: () => themes[0]?.id,
    setPreference: async (nextPreference) => {
      preference = nextPreference
    },
    setActiveTheme: async () => undefined,
    register: (_ownerExtensionId, nextThemes) => {
      themes.push(...nextThemes)
      return { dispose: () => undefined }
    },
    apply: () => undefined,
    onDidChange: () => ({ dispose: () => undefined }),
  }
}

function createMemorySettingsService(): WorkbenchSettingsService {
  const entries = reactive<WorkbenchSettingsService['entries']>([])
  const definitions = new Map<string, WorkbenchSettingsService['entries'][number]>()
  const listeners = new Set<(entry: WorkbenchSettingsService['entries'][number]) => void>()
  return {
    entries,
    register: (contribution: WorkbenchSettingsContribution) => {
      const schemaSettings: WorkbenchSettingDefinition[] =
        contribution.groups?.flatMap(
          (group) =>
            Object.entries(group.properties).map(([id, property]) => ({
              id,
              label: property.title ?? id,
              description: property.description,
              category:
                contribution.category ??
                (contribution.ownerExtensionId ? 'Extensions' : group.title),
              subcategory: group.title,
              type: property.type === 'array' ? 'array' : property.type,
              defaultValue:
                property.default ??
                (property.type === 'boolean'
                  ? false
                  : property.type === 'number'
                    ? 0
                    : property.type === 'array'
                      ? []
                      : property.type === 'object'
                        ? {}
                        : (property.enum?.[0] ?? '')),
              options: property.enum?.map((value, index) => ({
                label: property.enumLabels?.[index] ?? String(value),
                value: value as string | number | boolean,
                description: property.enumDescriptions?.[index],
              })),
              tags: property.tags,
              scope: property.scope,
              required: property.required,
              readonly: property.readonly,
            })) as WorkbenchSettingDefinition[],
        ) ?? []
      const owned = [...(contribution.settings ?? []), ...schemaSettings].map((setting) => ({
        ...setting,
        ownerExtensionId: setting.ownerExtensionId ?? contribution.ownerExtensionId,
        ownerExtensionName: setting.ownerExtensionName ?? contribution.ownerExtensionName,
        value: setting.defaultValue,
        modified: false,
        validationError: null,
      }))
      owned.forEach((entry) => {
        definitions.set(entry.id, entry)
        entries.push(entry)
      })
      return {
        dispose() {
          owned.forEach((entry) => {
            const index = entries.findIndex((item) => item.id === entry.id)
            if (index >= 0) entries.splice(index, 1)
          })
        },
      }
    },
    get: <T = unknown>(id: string, fallback?: T) =>
      (entries.find((entry) => entry.id === id)?.value ?? fallback) as T | undefined,
    set: async (id, value) => {
      const entry = entries.find((item) => item.id === id)
      if (!entry) return false
      if (entry.readonly) return false
      if (JSON.stringify(entry.value) === JSON.stringify(value)) return true
      entry.value = value
      entry.modified = JSON.stringify(value) !== JSON.stringify(entry.defaultValue)
      listeners.forEach((listener) => {
        listener(entry)
      })
      return true
    },
    inspect: <T = unknown>(id: string): WorkbenchSettingsInspection<T> => {
      const entry = entries.find((item) => item.id === id)
      return {
        key: id,
        defaultValue: entry?.defaultValue as T | undefined,
        userValue: entry?.modified ? (entry.value as T) : undefined,
        effectiveValue: entry?.value as T | undefined,
        source: entry?.modified ? 'user' : 'default',
      }
    },
    reset: async (id) => {
      const entry = entries.find((item) => item.id === id)
      if (!entry) return
      entry.value = entry.defaultValue
      entry.modified = false
      listeners.forEach((listener) => {
        listener(entry)
      })
    },
    resetCategory: async (category) => {
      for (const entry of entries.filter((item) => item.category === category)) {
        entry.value = entry.defaultValue
        entry.modified = false
        listeners.forEach((listener) => {
          listener(entry)
        })
      }
    },
    resetAll: async (ids) => {
      const targets = new Set(ids ?? entries.map((entry) => entry.id))
      for (const entry of entries.filter((item) => targets.has(item.id))) {
        entry.value = entry.defaultValue
        entry.modified = false
        listeners.forEach((listener) => {
          listener(entry)
        })
      }
    },
    export: (ids) => {
      const targets = new Set(ids ?? entries.map((entry) => entry.id))
      return JSON.stringify(
        Object.fromEntries(
          entries.filter((entry) => targets.has(entry.id)).map((entry) => [entry.id, entry.value]),
        ),
        null,
        2,
      )
    },
    import: async (contents) => {
      const parsed = JSON.parse(contents) as Record<string, unknown>
      const applied: string[] = []
      const rejected: Array<{ id: string; reason: string }> = []
      for (const [id, value] of Object.entries(parsed)) {
        const entry = entries.find((item) => item.id === id)
        if (!entry) rejected.push({ id, reason: 'Unknown setting.' })
        else {
          entry.value = value
          entry.modified = JSON.stringify(value) !== JSON.stringify(entry.defaultValue)
          applied.push(id)
          listeners.forEach((listener) => {
            listener(entry)
          })
        }
      }
      return { applied, rejected }
    },
    onDidChange: (listener) => {
      listeners.add(listener)
      return { dispose: () => listeners.delete(listener) }
    },
  }
}

function createMemoryCapabilityService(): ActiveLaneCapabilityService {
  const entries = reactive<ActiveLaneCapabilityRecord[]>([])
  const handlers = new Map<string, ActiveLaneCapabilityHandler | undefined>()
  return {
    entries,
    list(filter) {
      return entries.filter((entry) => {
        if (filter?.kind && entry.kind !== filter.kind) return false
        if (filter?.extensionId && entry.extensionId !== filter.extensionId) return false
        if (filter?.providerId && entry.providerId !== filter.providerId) return false
        return true
      })
    },
    get(id) {
      return entries.find((entry) => entry.id === id)
    },
    register(capability, handler, options) {
      const entry: ActiveLaneCapabilityRecord = {
        ...capability,
        source: options?.source ?? 'runtime',
      }
      entries.push(entry)
      handlers.set(entry.id, handler as ActiveLaneCapabilityHandler | undefined)
      return {
        dispose() {
          const index = entries.findIndex((item) => item.id === entry.id)
          if (index >= 0) entries.splice(index, 1)
          handlers.delete(entry.id)
        },
      }
    },
    async invoke<TResult = unknown, TInput = unknown>(
      capabilityId: string,
      input?: TInput,
      callerExtensionId?: string,
    ): Promise<TResult> {
      const capability = entries.find((entry) => entry.id === capabilityId)
      if (!capability) throw new Error(`Unknown capability: ${capabilityId}`)
      const handler = handlers.get(capabilityId)
      if (!handler) throw new Error(`Capability ${capabilityId} cannot be invoked.`)
      return (await handler({ capability, input, callerExtensionId })) as TResult
    },
  }
}

function createMemoryExplorerRuntime(): ExplorerRuntime {
  const state = reactive({
    providers: [],
    providerState: {},
    nodes: {},
    children: {},
    nodeState: {},
  }) as ExplorerRuntime['state']

  return {
    state,
    registerProvider(provider) {
      state.providers.push(provider)
      state.providerState[provider.id] = { id: provider.id, expanded: true, loading: false }
      return {
        dispose: () => {
          const index = state.providers.findIndex((candidate) => candidate.id === provider.id)
          if (index >= 0) state.providers.splice(index, 1)
          delete state.providerState[provider.id]
        },
      }
    },
    unregisterProvider(id) {
      const index = state.providers.findIndex((provider) => provider.id === id)
      if (index >= 0) state.providers.splice(index, 1)
      delete state.providerState[id]
    },
    getProviders: () => [...state.providers],
    refresh: () => {},
    reveal: async () => {},
    expand: () => {},
    collapse: () => {},
    setProviderExpanded: (providerId, expanded) => {
      state.providerState[providerId] = { id: providerId, expanded, loading: false }
    },
    toggle: async () => {},
    loadChildren: async () => [],
    select: () => {},
    focus: () => {},
    collapseAll: () => {},
    isExpanded: () => false,
    getChildren: () => undefined,
    getNode: () => undefined,
  }
}

export function createLegacyWorkbenchRuntime(
  workbench: WorkbenchShellApi,
  registry: WorkbenchRegisteredContributions,
): WorkbenchRuntimeApi {
  const records = reactive<WorkbenchRuntimeExtensionRecord[]>([])
  const host = createMemoryHost(workbench.state.hostMode)
  const themes = createMemoryThemeService()
  const settings = createMemorySettingsService()
  const capabilities = createMemoryCapabilityService()
  const settingsAwareWorkbench: WorkbenchShellApi = {
    ...workbench,
    state: workbench.state,
    openTab(input, behavior) {
      return workbench.openTab(
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
      workbench.setSidebarSize(size)
      void settings.set('workbench.layout.sidebar.width', workbench.state.sidebar.size)
    },
    setSidebarCollapsed(collapsed) {
      workbench.setSidebarCollapsed(collapsed)
      void settings.set('workbench.layout.sidebar.collapsed', collapsed)
    },
    setInspectorCollapsed(collapsed) {
      workbench.setInspectorCollapsed(collapsed)
      void settings.set('workbench.layout.inspector.collapsed', collapsed)
    },
    setBottomPanelOpen(open) {
      workbench.setBottomPanelOpen(open)
      void settings.set('workbench.layout.bottomPanel.open', open)
    },
    setActiveBottomPanelView(viewId) {
      workbench.setActiveBottomPanelView(viewId)
    },
  }

  let runtime: WorkbenchRuntimeApi

  async function executeCommand(commandId: string) {
    const command = registry.commands.find((item) => item.id === commandId)
    if (command?.enabled === false || command?.visible === false) return
    await command?.run?.({
      runtime,
      host: host as WorkbenchRuntimeApi['host'],
      workbench: settingsAwareWorkbench,
    })
  }

  const commandSearch = createCommandSearchService({
    registry,
    settings,
    extensions: {
      getRecord: () => undefined,
    },
    execute: executeCommand,
  })
  const explorer = createMemoryExplorerRuntime()

  runtime = {
    context: createRuntimeContext(host, {
      runtimeId: `legacy:${host.id}`,
    }),
    host: host as WorkbenchRuntimeApi['host'],
    workbench: settingsAwareWorkbench,
    themes,
    settings,
    fileOpeners: {
      register: (opener) => registerItem(registry, 'fileOpeners', opener),
      list: () => [...registry.fileOpeners],
      resolve: () => [],
      getPreferred: async () => undefined,
      setPreferred: async () => {},
      open: async () => 'fallback',
    },
    capabilities,
    explorer,
    registry,
    extensions: {
      records,
      discovered: [],
      install: async () => {},
      installFromPackage: async () => {},
      uninstall: async () => {},
      enable: async () => {},
      disable: async () => {},
      listInstalled: async () => [],
      activate: async () => {},
      deactivate: async () => {},
      reportSurfaceError: () => {},
      clearSurfaceErrors: () => {},
      getRecord: () => undefined,
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
        preview: false,
      })
    },
  })
  registry.commandPalette.push({
    id: 'workbench.commandPalette.openSettings',
    commandId: 'workbench.action.openSettings',
    title: 'Open Settings',
    category: 'Workbench',
    keywords: ['preferences', 'configure'],
  })

  return runtime
}

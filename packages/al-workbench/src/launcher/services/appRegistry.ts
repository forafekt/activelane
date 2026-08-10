import { reactive, watch } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type {
  WorkbenchApplicationContribution,
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
} from '../../core/workbench/contributions'

import type { ApplicationRegistryService } from '../types'
import { searchLauncherApps } from './search'
import { createWorkspaceSwitcherService } from './workspaces'

const STORAGE_KEY = 'launcher-state'
const OWNER_ID = 'activelane.launcher'
const LAUNCH_COMMAND_PREFIX = 'workbench.launcher.launchApp.'

interface LauncherPersistedState {
  pinnedAppIds?: string[]
  recentAppIds?: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isValidLaunch(launch: unknown) {
  if (!isObject(launch) || typeof launch.type !== 'string') return false
  if (launch.type === 'tab') {
    return (
      typeof launch.tabKind === 'string' ||
      typeof launch.kind === 'string' ||
      typeof launch.component === 'string'
    )
  }
  if (launch.type === 'command') return typeof launch.commandId === 'string'
  if (launch.type === 'activity') return typeof launch.activityId === 'string'
  if (launch.type === 'external-url') return typeof launch.url === 'string'
  return false
}

function isValidApp(app: WorkbenchApplicationContribution) {
  return Boolean(app.id?.trim() && app.name?.trim() && isValidLaunch(app.launch))
}

function uniqueExisting(ids: string[], apps: WorkbenchApplicationContribution[]) {
  const appIds = new Set(apps.map((app) => app.id))
  return Array.from(new Set(ids)).filter((id) => appIds.has(id))
}

function generatedCommandId(appId: string) {
  return `${LAUNCH_COMMAND_PREFIX}${appId}`
}

export function createApplicationRegistryService(
  runtime: WorkbenchRuntimeApi,
): ApplicationRegistryService {
  const storage = runtime.host.capabilities.storage?.scope('workbench.launcher')
  const workspace = createWorkspaceSwitcherService(runtime)
  const state = reactive({
    open: false,
    query: '',
    selectedIndex: 0,
    pinnedAppIds: [] as string[],
    recentAppIds: [] as string[],
  })

  async function persist() {
    const payload: LauncherPersistedState = {
      pinnedAppIds: state.pinnedAppIds,
      recentAppIds: state.recentAppIds,
    }
    await storage?.set(STORAGE_KEY, payload)
  }

  void (async () => {
    const persisted = await storage?.get<LauncherPersistedState>(STORAGE_KEY)
    if (!persisted) return
    if (Array.isArray(persisted.pinnedAppIds)) state.pinnedAppIds = persisted.pinnedAppIds
    if (Array.isArray(persisted.recentAppIds)) state.recentAppIds = persisted.recentAppIds
  })()

  function installedEnabledApp(app: WorkbenchApplicationContribution) {
    if (!app.ownerExtensionId) return true
    const record = runtime.extensions.getRecord(app.ownerExtensionId)
    return !record || (record.installed && record.enabled && record.active)
  }

  function getApps() {
    return runtime.registry.apps
      .filter((app) => isValidApp(app) && installedEnabledApp(app))
      .slice()
      .sort(
        (left, right) =>
          (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name),
      )
  }

  function getApp(id: string) {
    return getApps().find((app) => app.id === id)
  }

  function searchApps(query: string) {
    const apps = getApps()
    const appById = new Map(apps.map((app) => [app.id, app]))
    const searchableApps = apps.map((app) => {
      const manifest = app.ownerExtensionId
        ? runtime.extensions.getRecord(app.ownerExtensionId)?.manifest
        : undefined
      return {
        ...app,
        keywords: [
          ...(app.keywords ?? []),
          app.ownerExtensionId,
          manifest?.displayName,
          manifest?.name,
          manifest?.author,
          ...(manifest?.categories ?? []),
          ...(manifest?.keywords ?? []),
        ].filter((value): value is string => Boolean(value)),
      }
    })
    return searchLauncherApps(searchableApps, query)
      .map((result) => appById.get(result.app.id))
      .filter((app): app is WorkbenchApplicationContribution => Boolean(app))
  }

  function selectedApps() {
    return searchApps(state.query)
  }

  function syncGeneratedCommands() {
    const generatedCommands = new Set(getApps().map((app) => generatedCommandId(app.id)))
    runtime.registry.commands.splice(
      0,
      runtime.registry.commands.length,
      ...runtime.registry.commands.filter(
        (command) =>
          command.ownerExtensionId !== OWNER_ID ||
          command.id === 'workbench.launcher.showApps' ||
          generatedCommands.has(command.id),
      ),
    )
    runtime.registry.commandPalette.splice(
      0,
      runtime.registry.commandPalette.length,
      ...runtime.registry.commandPalette.filter(
        (item) =>
          item.ownerExtensionId !== OWNER_ID ||
          item.id === 'workbench.launcher.showApps.palette' ||
          generatedCommands.has(item.commandId),
      ),
    )

    const existingCommands = new Set(runtime.registry.commands.map((command) => command.id))
    const existingPalette = new Set(runtime.registry.commandPalette.map((item) => item.id))
    for (const app of getApps()) {
      const commandId = generatedCommandId(app.id)
      if (!existingCommands.has(commandId)) {
        runtime.registry.commands.push({
          id: commandId,
          title: `Launch App: ${app.name}`,
          category: 'Launcher',
          ownerExtensionId: OWNER_ID,
          run: () => service.launchApp(app.id),
        } satisfies WorkbenchCommandContribution)
      }
      const paletteId = `${commandId}.palette`
      if (!existingPalette.has(paletteId)) {
        runtime.registry.commandPalette.push({
          id: paletteId,
          title: `Launch App: ${app.name}`,
          commandId,
          category: 'Launcher',
          description: app.description,
          keywords: ['app', 'launcher', app.category, ...(app.keywords ?? [])].filter(
            (value): value is string => Boolean(value),
          ),
          ownerExtensionId: OWNER_ID,
        } satisfies WorkbenchCommandPaletteContribution)
      }
    }
  }

  const service: ApplicationRegistryService = reactive({
    get open() {
      return state.open
    },
    set open(value: boolean) {
      state.open = value
    },
    get query() {
      return state.query
    },
    set query(value: string) {
      state.query = value
    },
    get selectedIndex() {
      return state.selectedIndex
    },
    set selectedIndex(value: number) {
      state.selectedIndex = value
    },
    getApps,
    getApp,
    searchApps,
    getPinnedApps() {
      return uniqueExisting(state.pinnedAppIds, getApps())
        .map((id) => getApp(id))
        .filter((app): app is WorkbenchApplicationContribution => Boolean(app))
    },
    getRecentApps() {
      return uniqueExisting(state.recentAppIds, getApps())
        .map((id) => getApp(id))
        .filter((app): app is WorkbenchApplicationContribution => Boolean(app))
    },
    getCategories() {
      const groups = new Map<string, WorkbenchApplicationContribution[]>()
      for (const app of getApps()) {
        const category = app.category || 'Other'
        groups.set(category, [...(groups.get(category) ?? []), app])
      }
      return Array.from(groups.entries())
        .map(([name, apps]) => ({ name, apps }))
        .sort((left, right) => left.name.localeCompare(right.name))
    },
    async launchApp(id: string) {
      const app = getApp(id)
      if (!app) return
      const launch = app.launch
      if (launch.type === 'tab') {
        runtime.workbench.openTab(
          {
            id: launch.tabId ?? app.id,
            kind: launch.kind ?? launch.tabKind ?? launch.component ?? app.id,
            title: launch.title ?? app.name,
            surfaceId: launch.surfaceId,
            ownerExtensionId: app.ownerExtensionId,
            icon: typeof app.icon === 'string' ? undefined : app.icon,
            pinned: launch.pinned ?? false,
            preview: launch.preview ?? false,
            input: launch.input,
          },
          { mode: launch.preview ? 'preview' : 'persistent', source: 'command' },
        )
      } else if (launch.type === 'command') {
        await runtime.commands.execute(launch.commandId)
      } else if (launch.type === 'activity') {
        runtime.workbench.setActiveActivity(launch.activityId)
        if (launch.sidebarViewId) runtime.workbench.setActiveSidebarView(launch.sidebarViewId)
      } else if (launch.type === 'external-url') {
        window.open(launch.url, '_blank', 'noopener,noreferrer')
      }
      await service.recordRecentApp(id)
      service.setOpen(false)
    },
    async pinApp(id: string) {
      if (!getApp(id) || state.pinnedAppIds.includes(id)) return
      state.pinnedAppIds.unshift(id)
      await persist()
    },
    async unpinApp(id: string) {
      state.pinnedAppIds = state.pinnedAppIds.filter((item) => item !== id)
      await persist()
    },
    isPinned(id: string) {
      return state.pinnedAppIds.includes(id)
    },
    async recordRecentApp(id: string) {
      if (!getApp(id)) return
      state.recentAppIds = [id, ...state.recentAppIds.filter((item) => item !== id)].slice(0, 12)
      await persist()
    },
    setOpen(open: boolean) {
      state.open = open
      if (open) {
        state.query = ''
        state.selectedIndex = 0
      }
    },
    toggle() {
      service.setOpen(!state.open)
    },
    setQuery(query: string) {
      state.query = query
      state.selectedIndex = 0
    },
    moveSelection(delta: number) {
      const apps = selectedApps()
      if (!apps.length) {
        state.selectedIndex = 0
        return
      }
      state.selectedIndex = (state.selectedIndex + delta + apps.length) % apps.length
    },
    workspace,
    dispose() {},
  }) as ApplicationRegistryService

  if (!runtime.registry.commands.some((command) => command.id === 'workbench.launcher.showApps')) {
    runtime.registry.commands.push({
      id: 'workbench.launcher.showApps',
      title: 'Show Apps',
      category: 'Launcher',
      shortcut: 'Mod+Shift+A',
      ownerExtensionId: OWNER_ID,
      run: () => service.setOpen(true),
    })
  }
  if (
    !runtime.registry.commandPalette.some(
      (item) => item.id === 'workbench.launcher.showApps.palette',
    )
  ) {
    runtime.registry.commandPalette.push({
      id: 'workbench.launcher.showApps.palette',
      title: 'Show Apps',
      commandId: 'workbench.launcher.showApps',
      category: 'Launcher',
      description: 'Open the ActiveLane app launcher.',
      keywords: ['apps', 'applications', 'launcher', 'show apps'],
      ownerExtensionId: OWNER_ID,
    })
  }

  syncGeneratedCommands()
  const stopWatchingApps = watch(
    () => runtime.registry.apps.map((app) => app.id).join('\n'),
    syncGeneratedCommands,
  )
  service.dispose = () => {
    stopWatchingApps()
    if (runtime.applications === service) runtime.applications = undefined
  }
  runtime.applications = service

  return service
}

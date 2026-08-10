import { evaluateWorkbenchContextExpression } from '../../core/menus/context'
import type {
  ActiveLaneOperatingSystem,
  ActiveLaneRuntimePlatform,
  WorkbenchMenuPlacement,
  WorkbenchMenuResolveContext,
  WorkbenchResolvedMenuGroup,
  WorkbenchResolvedMenuItem,
} from '../../core/menus/menuContracts'
import { WorkbenchApplicationMenuId } from '../../core/menus/menuContracts'
import type {
  WorkbenchMenuItemContribution,
  WorkbenchTab,
  WorkbenchTabContext,
} from '../../core/workbench/contributions'
import type { WorkbenchRegisteredContributions } from '../../core/workbench/shell'

const placementAliases: Record<string, WorkbenchMenuPlacement> = {
  topBar: 'workbench/top-bar',
  activityLauncher: 'activity-launcher',
}

const globalApplicationLocations = new Set(['global/app', 'global/menuBar'])

export function createTabContext(tab: WorkbenchTab, groupId: string): WorkbenchTabContext {
  return {
    tab,
    groupId,
    tabKind: tab.kind,
    ownerExtensionId: tab.ownerExtensionId,
    pinned: tab.pinned,
    dirty: tab.dirty,
    preview: tab.preview,
    lifecycle: tab.lifecycle,
    closable: tab.closable,
    capabilities: tab.capabilities ?? [],
  }
}

export function resolveTabContextMenu(
  registry: WorkbenchRegisteredContributions,
  context: WorkbenchTabContext,
) {
  const scope = createContextScope({
    platform: 'web',
    os: 'unknown',
    placement: 'tab/context',
    tabKind: context.tabKind,
    ownerExtensionId: context.ownerExtensionId,
    pinned: context.pinned,
    dirty: context.dirty,
    preview: context.preview,
    lifecycle: context.lifecycle,
    closable: context.closable,
  })

  return [...registry.tabContextMenu, ...registry.menus]
    .filter((item) => item.location === 'tab/context' && matchesTabContext(item, context, scope))
    .sort(compareMenuContributions)
}

export function resolveApplicationMenus(
  registry: WorkbenchRegisteredContributions,
  context: WorkbenchMenuResolveContext,
): WorkbenchResolvedMenuGroup[] {
  const scope = createContextScope(context)
  const topLevelMenus = registry.globalMenus
    .filter((menu) => menuMatchesPlacement(menu.placement, context.placement))
    .filter((menu) => evaluateWorkbenchContextExpression(menu.when, scope))
    .sort(compareTopLevelMenus)

  return topLevelMenus.map((menu) => {
    const items = resolveMenuItems(registry, menu.menuId, context, scope)
    return {
      id: menu.id,
      label: menu.title,
      menuId: menu.menuId,
      order: menu.order ?? 0,
      items,
    }
  })
}

export function resolveGlobalMenuGroups(
  registry: WorkbenchRegisteredContributions,
  placement: 'topBar' | 'activityLauncher',
  context: Record<string, boolean | number | string | null | undefined> = {},
) {
  return resolveApplicationMenus(registry, {
    platform: 'web',
    os: 'unknown',
    placement: placementAliases[placement] ?? 'workbench/top-bar',
    ...context,
  })
}

export function createDesktopNativeMenuSnapshot(
  registry: WorkbenchRegisteredContributions,
  input: {
    os: ActiveLaneOperatingSystem
    platform?: ActiveLaneRuntimePlatform
    context?: Record<string, boolean | number | string | null | undefined>
  },
) {
  return {
    platform: 'desktop' as const,
    os: input.os,
    menus: sanitizeNativeMenuGroups(
      resolveApplicationMenus(registry, {
        platform: input.platform ?? 'desktop',
        os: input.os,
        placement: 'native/app-menu',
        ...(input.context ?? {}),
      }),
    ),
  }
}

function sanitizeNativeMenuGroups(
  groups: WorkbenchResolvedMenuGroup[],
): WorkbenchResolvedMenuGroup[] {
  return groups.map((group) => ({
    id: String(group.id),
    label: String(group.label),
    menuId: group.menuId,
    order: group.order,
    items: sanitizeNativeMenuItems(group.items),
  }))
}

function sanitizeNativeMenuItems(items: WorkbenchResolvedMenuItem[]): WorkbenchResolvedMenuItem[] {
  return items.map((item) => {
    if (item.kind === 'separator') {
      return {
        kind: 'separator',
        id: String(item.id),
        group: item.group,
        order: item.order,
      }
    }

    if (item.kind === 'submenu') {
      return {
        kind: 'submenu',
        id: String(item.id),
        label: String(item.label),
        menuId: item.menuId,
        group: item.group,
        order: item.order,
        items: sanitizeNativeMenuItems(item.items),
      }
    }

    return {
      kind: 'command',
      id: String(item.id),
      label: String(item.label),
      commandId: String(item.commandId),
      enabled: Boolean(item.enabled),
      visible: Boolean(item.visible),
      group: item.group,
      order: item.order,
      shortcut: item.shortcut,
      nativeRole: item.nativeRole,
      checked: item.checked,
    }
  })
}

function resolveMenuItems(
  registry: WorkbenchRegisteredContributions,
  menuId: string,
  context: WorkbenchMenuResolveContext,
  scope: Record<string, boolean | number | string | null | undefined>,
): WorkbenchResolvedMenuItem[] {
  const resolved: WorkbenchResolvedMenuItem[] = []
  const items = registry.menus
    .filter((item) => contributionBelongsToMenu(item, menuId, context.placement))
    .filter((item) => evaluateWorkbenchContextExpression(item.when, scope))
    .sort(compareMenuContributions)

  for (const item of items) {
    if (item.kind === 'separator') {
      resolved.push({
        kind: 'separator',
        id: item.id,
        group: item.group,
        order: item.order ?? 0,
      })
      continue
    }

    if (item.kind === 'submenu' && item.submenu) {
      resolved.push({
        kind: 'submenu',
        id: item.id,
        label: item.title,
        menuId: item.submenu,
        group: item.group,
        order: item.order ?? 0,
        items: resolveMenuItems(registry, item.submenu, context, scope),
      })
      continue
    }

    if (!item.commandId) continue
    const command = registry.commands.find((candidate) => candidate.id === item.commandId)
    const visible = command?.visible !== false
    if (!visible) continue
    const enabled =
      command?.enabled !== false && evaluateWorkbenchContextExpression(item.enablement, scope)
    const checked =
      typeof item.checked === 'string'
        ? evaluateWorkbenchContextExpression(item.checked, scope)
        : item.checked
    resolved.push({
      kind: 'command',
      id: item.id,
      label: item.title,
      commandId: item.commandId,
      enabled,
      visible,
      group: item.group,
      order: item.order ?? 0,
      icon: item.icon ?? command?.icon,
      shortcut: item.shortcut ?? command?.shortcut,
      nativeRole: item.nativeRole,
      checked,
    })
  }

  return compactSeparators(resolved)
}

function contributionBelongsToMenu(
  item: { location: string; menuId?: string; group?: string },
  menuId: string,
  placement: WorkbenchMenuPlacement,
) {
  if (item.menuId) return item.menuId === menuId
  if (placement === 'activity-launcher') {
    return (
      (item.location === 'global/activity' || globalApplicationLocations.has(item.location)) &&
      item.group === menuId
    )
  }
  if (placement === 'native/app-menu' || placement === 'workbench/top-bar') {
    return globalApplicationLocations.has(item.location) && item.group === menuId
  }
  return item.group === menuId
}

function menuMatchesPlacement(
  placements: Array<'topBar' | 'activityLauncher' | WorkbenchMenuPlacement> | undefined,
  placement: WorkbenchMenuPlacement,
) {
  if (!placements?.length) return true
  return placements.some((candidate) => (placementAliases[candidate] ?? candidate) === placement)
}

function matchesTabContext(
  item: WorkbenchMenuItemContribution,
  context: WorkbenchTabContext,
  scope: Record<string, boolean | number | string | null | undefined>,
) {
  const filters = item.contexts
  if (filters?.tabKinds?.length && !filters.tabKinds.includes(context.tabKind)) return false
  if (
    filters?.ownerExtensionIds?.length &&
    !filters.ownerExtensionIds.includes(context.ownerExtensionId ?? '')
  ) {
    return false
  }
  if (typeof filters?.pinned === 'boolean' && filters.pinned !== context.pinned) return false
  if (typeof filters?.dirty === 'boolean' && filters.dirty !== context.dirty) return false
  if (typeof filters?.preview === 'boolean' && filters.preview !== context.preview) return false
  if (filters?.lifecycle?.length && !filters.lifecycle.includes(context.lifecycle)) return false
  if (
    filters?.capabilities?.length &&
    !filters.capabilities.every((capability) => context.capabilities.includes(capability))
  ) {
    return false
  }
  return evaluateWorkbenchContextExpression(item.when, scope)
}

function createContextScope(context: WorkbenchMenuResolveContext | Record<string, unknown>) {
  return {
    ...context,
    platform: context.platform,
    os: context.os,
    placement: context.placement,
    isWeb: context.platform === 'web',
    isDesktop: context.platform === 'desktop',
    isBrowserExtension: context.platform === 'browser-extension',
    isMac: context.os === 'macos',
    isWindows: context.os === 'windows',
    isLinux: context.os === 'linux',
  } as Record<string, boolean | number | string | null | undefined>
}

function compactSeparators(items: WorkbenchResolvedMenuItem[]) {
  const compacted: WorkbenchResolvedMenuItem[] = []
  for (const item of items) {
    if (
      item.kind === 'separator' &&
      (!compacted.length || compacted.at(-1)?.kind === 'separator')
    ) {
      continue
    }
    compacted.push(item)
  }
  while (compacted.at(-1)?.kind === 'separator') compacted.pop()
  return compacted
}

function compareTopLevelMenus(
  left: { order?: number; title: string },
  right: { order?: number; title: string },
) {
  return (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title)
}

function compareMenuContributions(
  left: { order?: number; title: string },
  right: { order?: number; title: string },
) {
  return (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title)
}

export { WorkbenchApplicationMenuId }

import { evaluateWorkbenchContextExpression } from '../menus/menuContracts'
import type { ActiveLaneHostKind } from '../runtime/context'
import type {
  WorkbenchContributionZoneId,
  WorkbenchStatusBarAlignment,
  WorkbenchStatusBarItemContribution,
} from './contributions'
import type { WorkbenchRegisteredContributions } from './shell'

export interface WorkbenchZoneResolveContext {
  platform?: ActiveLaneHostKind | 'web'
  os?: 'macos' | 'windows' | 'linux' | 'unknown'
  [key: string]: boolean | number | string | null | undefined
}

export type WorkbenchZoneContribution =
  | WorkbenchRegisteredContributions['activityRail'][number]
  | WorkbenchRegisteredContributions['sidebarViews'][number]
  | WorkbenchRegisteredContributions['bottomPaneViews'][number]
  | WorkbenchRegisteredContributions['inspectorPanels'][number]
  | WorkbenchRegisteredContributions['tabRenderers'][number]
  | WorkbenchRegisteredContributions['tabSurfaces'][number]
  | WorkbenchRegisteredContributions['tabToolbarActions'][number]
  | WorkbenchRegisteredContributions['globalMenus'][number]
  | WorkbenchRegisteredContributions['menus'][number]
  | WorkbenchRegisteredContributions['commands'][number]
  | WorkbenchStatusBarItemContribution

export interface ResolvedWorkbenchStatusBarItem extends WorkbenchStatusBarItemContribution {
  alignment: WorkbenchStatusBarAlignment
  label: string
}

const zoneKeys = {
  'workbench.activityRail': ['activityRail'],
  'workbench.panel.left': ['sidebarViews'],
  'workbench.panel.right': ['inspectorPanels'],
  'workbench.panel.bottom': ['bottomPaneViews'],
  'workbench.tabs': ['tabRenderers', 'tabSurfaces'],
  'workbench.tabRail': ['tabToolbarActions', 'tabContextMenu'],
  'workbench.menu.global': ['globalMenus', 'menus'],
  'workbench.menu.application': ['globalMenus', 'menus'],
  'workbench.commands': ['commands', 'commandPalette'],
} satisfies Partial<
  Record<WorkbenchContributionZoneId, Array<keyof WorkbenchRegisteredContributions>>
>

function compareContributions(
  left: { order?: number; title?: string; id: string },
  right: { order?: number; title?: string; id: string },
) {
  return (
    (left.order ?? 0) - (right.order ?? 0) ||
    (left.title ?? left.id).localeCompare(right.title ?? right.id)
  )
}

function compareStatusBarItems(
  left: ResolvedWorkbenchStatusBarItem,
  right: ResolvedWorkbenchStatusBarItem,
) {
  if (left.alignment !== right.alignment) return left.alignment === 'left' ? -1 : 1
  return compareContributions(left, right)
}

export function createWorkbenchZoneScope(context: WorkbenchZoneResolveContext = {}) {
  const platform = context.platform ?? 'web'
  const os = context.os ?? 'unknown'
  return {
    ...context,
    platform,
    os,
    isWeb: platform === 'web' || platform === 'webapp',
    isWebapp: platform === 'webapp',
    isDesktop: platform === 'desktop',
    isBrowserExtension: platform === 'browser-extension',
    isServer: platform === 'server',
    isMac: os === 'macos',
    isWindows: os === 'windows',
    isLinux: os === 'linux',
  }
}

export function resolveWorkbenchZoneContributions(
  registry: WorkbenchRegisteredContributions,
  zoneId: WorkbenchContributionZoneId,
  context: WorkbenchZoneResolveContext = {},
): WorkbenchZoneContribution[] {
  if (zoneId === 'workbench.statusBar') return resolveStatusBarItems(registry, context)

  const keys = zoneKeys[zoneId] ?? []
  const scope = createWorkbenchZoneScope(context)
  return keys
    .flatMap((key) => registry[key] as WorkbenchZoneContribution[])
    .filter((item) => evaluateWorkbenchContextExpression((item as { when?: string }).when, scope))
    .sort(compareContributions)
}

export function resolveStatusBarItems(
  registry: Pick<WorkbenchRegisteredContributions, 'statusBar' | 'commands'>,
  context: WorkbenchZoneResolveContext = {},
): ResolvedWorkbenchStatusBarItem[] {
  const scope = createWorkbenchZoneScope(context)
  return registry.statusBar
    .filter((item) => item.visible !== false)
    .filter((item) => evaluateWorkbenchContextExpression(item.when, scope))
    .map((item) => ({
      ...item,
      alignment: item.alignment ?? 'left',
      label: item.label ?? item.title,
    }))
    .sort(compareStatusBarItems)
}

import type {
  OpenWorkbenchTabOptions,
  WorkbenchActionContribution,
  WorkbenchActivityContribution,
  WorkbenchApplicationContribution,
  WorkbenchBottomPaneContribution,
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
  WorkbenchGlobalMenuContribution,
  WorkbenchInspectorPanelContribution,
  WorkbenchMenuItemContribution,
  WorkbenchPartContribution,
  WorkbenchSettingsPageContribution,
  WorkbenchSidebarViewContribution,
  WorkbenchStatusBarItemContribution,
  WorkbenchTab,
  WorkbenchTabRendererContribution,
} from './contributions'
import type { WorkbenchRegisteredContributions } from './shell'
import type { WorkbenchTabSurfaceContribution } from './surfaces'

type MarkRaw = <T>(value: T) => T
type ContributionKey = keyof WorkbenchRegisteredContributions

function rawValue<T>(value: T | undefined, markRaw: MarkRaw): T | undefined {
  if (value === undefined || value === null || typeof value === 'string') return value
  return markRaw(value)
}

function rawAction<T extends WorkbenchActionContribution>(action: T, markRaw: MarkRaw): T {
  return {
    ...action,
    icon: rawValue(action.icon, markRaw),
  }
}

function rawMenu<T extends WorkbenchMenuItemContribution>(item: T, markRaw: MarkRaw): T {
  return {
    ...item,
    icon: rawValue(item.icon, markRaw),
  }
}

function rawSurface<T extends { component?: unknown; props?: unknown; passThrough?: unknown }>(
  surface: T | undefined,
  markRaw: MarkRaw,
): T | undefined {
  if (!surface) return surface
  return {
    ...surface,
    component: rawValue(surface.component, markRaw),
  }
}

export function normalizeWorkbenchContribution<T extends ContributionKey>(
  key: T,
  item: WorkbenchRegisteredContributions[T][number],
  markRaw: MarkRaw,
): WorkbenchRegisteredContributions[T][number] {
  switch (key) {
    case 'parts':
      return {
        ...(item as WorkbenchPartContribution),
        component: rawValue((item as WorkbenchPartContribution).component, markRaw),
      }
    case 'statusBar':
      return {
        ...(item as WorkbenchStatusBarItemContribution),
        icon: rawValue((item as WorkbenchStatusBarItemContribution).icon, markRaw),
      }
    case 'globalMenus':
      return item as WorkbenchGlobalMenuContribution
    case 'activityRail':
      return {
        ...(item as WorkbenchActivityContribution),
        icon: rawValue((item as WorkbenchActivityContribution).icon, markRaw),
      }
    case 'apps':
      return {
        ...(item as WorkbenchApplicationContribution),
        icon: rawValue((item as WorkbenchApplicationContribution).icon, markRaw),
      }
    case 'sidebarViews': {
      const view = item as WorkbenchSidebarViewContribution
      return {
        ...view,
        component: rawValue(view.component, markRaw),
        footerComponent: rawValue(view.footerComponent, markRaw),
        actions: view.actions?.map((action) => rawAction(action, markRaw)),
      }
    }
    case 'commands':
      return {
        ...(item as WorkbenchCommandContribution),
        icon: rawValue((item as WorkbenchCommandContribution).icon, markRaw),
      }
    case 'commandPalette':
      return {
        ...(item as WorkbenchCommandPaletteContribution),
        icon: rawValue((item as WorkbenchCommandPaletteContribution).icon, markRaw),
      }
    case 'tabRenderers': {
      const renderer = item as WorkbenchTabRendererContribution
      return {
        ...renderer,
        component: rawValue(renderer.component, markRaw),
        surface:
          typeof renderer.surface === 'function'
            ? markRaw(renderer.surface)
            : rawSurface(renderer.surface, markRaw),
      }
    }
    case 'tabSurfaces':
      return rawSurface(
        item as WorkbenchTabSurfaceContribution,
        markRaw,
      ) as WorkbenchRegisteredContributions[T][number]
    case 'tabToolbarActions':
      return rawAction(item as WorkbenchActionContribution, markRaw)
    case 'tabContextMenu':
      return rawMenu(item as WorkbenchMenuItemContribution, markRaw)
    case 'bottomPaneViews':
      return {
        ...(item as WorkbenchBottomPaneContribution),
        icon: rawValue((item as WorkbenchBottomPaneContribution).icon, markRaw),
        component: rawValue((item as WorkbenchBottomPaneContribution).component, markRaw),
      }
    case 'inspectorPanels':
      return {
        ...(item as WorkbenchInspectorPanelContribution),
        component: rawValue((item as WorkbenchInspectorPanelContribution).component, markRaw),
      }
    case 'settingsPages':
      return {
        ...(item as WorkbenchSettingsPageContribution),
        component: rawValue((item as WorkbenchSettingsPageContribution).component, markRaw),
      }
    case 'menus':
      return rawMenu(item as WorkbenchMenuItemContribution, markRaw)
    case 'fileOpeners':
      return item
    default:
      return item
  }
}

export function normalizeWorkbenchTabOptions<T extends OpenWorkbenchTabOptions>(
  input: T,
  markRaw: MarkRaw,
): T {
  return {
    ...input,
    icon: rawValue(input.icon, markRaw),
    surface: rawSurface(input.surface, markRaw),
  }
}

export function normalizeWorkbenchTab<T extends WorkbenchTab>(tab: T, markRaw: MarkRaw): T {
  return {
    ...tab,
    icon: rawValue(tab.icon, markRaw),
    surface: rawSurface(tab.surface, markRaw),
  }
}

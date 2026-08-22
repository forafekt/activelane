import type {
  OpenWorkbenchTabOptions,
  WorkbenchOpenTabBehavior,
  WorkbenchTab,
} from '../../workbench/contributions'
import type { WorkbenchTabGroupNode } from '../../workbench/shell'
import { createId } from './utils'

export function normalizeTab(tab: WorkbenchTab, fallbackGroupId: string): WorkbenchTab {
  const pinned = tab.pinned ?? false
  const dirty = tab.dirty ?? false
  const preview = pinned || dirty ? false : (tab.preview ?? tab.lifecycle === 'preview')
  return {
    ...tab,
    groupId: tab.groupId || fallbackGroupId,
    tabGroupId: tab.tabGroupId ?? null,
    color: tab.color === 'default' ? undefined : tab.color,
    locked: tab.locked ?? false,
    protection: tab.protection ?? null,
    closable: tab.closable ?? true,
    pinned,
    preview,
    dirty,
    lifecycle: pinned ? 'pinned' : dirty ? 'dirty' : preview ? 'preview' : 'persistent',
    capabilities: tab.capabilities ?? [],
    indicators: tab.indicators ?? [],
    hibernation: tab.hibernation,
  }
}

export function normalizeTabs(tabs: WorkbenchTab[]) {
  return [...tabs.filter((tab) => tab.pinned), ...tabs.filter((tab) => !tab.pinned)]
}

export function resolveOpenMode(
  input: OpenWorkbenchTabOptions,
  behavior?: WorkbenchOpenTabBehavior,
) {
  if (behavior?.mode) return behavior.mode
  if (input.lifecycle === 'pinned' || input.pinned) return 'pinned'
  if (input.lifecycle === 'persistent' || input.dirty || input.preview === false)
    return 'persistent'
  if (input.lifecycle === 'preview' || input.preview === true) return 'preview'
  return 'preview'
}

export function createTab(
  input: OpenWorkbenchTabOptions,
  groupId: string,
  behavior?: WorkbenchOpenTabBehavior,
): WorkbenchTab {
  const mode = resolveOpenMode(input, behavior)
  const pinned = mode === 'pinned'
  const dirty = input.dirty ?? false
  const preview = mode === 'preview' && !pinned && !dirty
  return {
    id: input.id ?? createId(`tab:${input.kind}`),
    kind: input.kind,
    title: input.title,
    icon: input.icon,
    surfaceId: input.surfaceId,
    surface: input.surface,
    ownerExtensionId: input.ownerExtensionId,
    order: 0,
    closable: input.closable ?? true,
    pinned,
    preview,
    dirty,
    lifecycle: pinned ? 'pinned' : dirty ? 'dirty' : preview ? 'preview' : 'persistent',
    groupId,
    tabGroupId: input.tabGroupId ?? null,
    color: input.color === 'default' ? undefined : input.color,
    locked: input.locked ?? false,
    protection: input.protection ?? null,
    input: input.input,
    resource: input.resource,
    viewInstanceId: input.viewInstanceId,
    capabilities: input.capabilities ?? [],
    indicators: input.indicators ?? [],
    hibernation: input.hibernation,
  }
}

export function updateTabLifecycle(tab: WorkbenchTab) {
  tab.preview = tab.pinned || tab.dirty ? false : tab.preview
  tab.lifecycle = tab.pinned
    ? 'pinned'
    : tab.dirty
      ? 'dirty'
      : tab.preview
        ? 'preview'
        : 'persistent'
}

export function insertTabRespectingPinned(group: WorkbenchTabGroupNode, tab: WorkbenchTab) {
  if (tab.pinned) {
    const firstUnpinnedIndex = group.tabs.findIndex((item) => !item.pinned)
    group.tabs.splice(firstUnpinnedIndex >= 0 ? firstUnpinnedIndex : group.tabs.length, 0, tab)
    return
  }
  group.tabs.push(tab)
}

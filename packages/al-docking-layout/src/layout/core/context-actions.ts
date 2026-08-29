import type { LayoutStore } from './store'
import type { ContextAction, Edge, PaneGroupNode, PaneInstance } from './types'

export function paneActions(
  store: LayoutStore,
  group: PaneGroupNode,
  pane: PaneInstance,
): ContextAction[] {
  const actions: ContextAction[] = [
    {
      id: 'close',
      label: 'Close',
      shortcut: 'Ctrl+W',
      disabled: pane.closable === false,
      run: () => store.closePane(pane.id),
    },
    {
      id: 'hide',
      label: 'Hide',
      run: () => store.hidePane(pane.id),
    },
    {
      id: 'fullscreen',
      label: store.state.fullscreenGroupId === group.id ? 'Exit fullscreen' : 'Fullscreen',
      shortcut: 'F11',
      run: () => store.toggleFullscreen(group.id),
    },
  ]
  for (const edge of ['left', 'right', 'top', 'bottom'] as Edge[])
    actions.push({
      id: `collapse-${edge}`,
      label: `Collapse to ${edge}`,
      run: () => store.collapse(group.id, edge),
    })
  actions.push(...store.actions.resolve({ group, pane }))
  return actions
}

export function groupActions(store: LayoutStore, group: PaneGroupNode): ContextAction[] {
  const actions: ContextAction[] = [
    {
      id: 'fullscreen',
      label: store.state.fullscreenGroupId === group.id ? 'Restore' : 'Fullscreen',
      shortcut: 'F11',
      run: () => store.toggleFullscreen(group.id),
    },
    { id: 'hide-group', label: 'Hide pane', run: () => store.hideGroup(group.id) },
    ...group.hiddenTabIds.map((id) => {
      const pane = group.tabs.find((tab) => tab.id === id)
      return {
        id: `show-${id}`,
        label: `Show ${pane?.title ?? store.registry.get(pane?.type ?? '')?.title ?? id}`,
        run: () => store.show(id),
      }
    }),
  ]
  actions.push(...store.groupActions.resolve({ group }))
  return actions
}

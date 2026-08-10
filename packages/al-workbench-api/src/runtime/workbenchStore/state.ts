import type { WorkbenchShellState } from '../../index'
import { createRootGroup, DEFAULT_GROUP_ID, DEFAULT_LAYOUT_PREFERENCE } from './layout'
import { createPaneState } from './panes'
import { clone } from './utils'

export function createInitialShellState(
  hostMode: WorkbenchShellState['hostMode'],
  initialState: Partial<WorkbenchShellState>,
): WorkbenchShellState {
  return {
    hostMode,
    activeActivityId: null,
    activeSidebarViewId: null,
    layoutPreference: { ...DEFAULT_LAYOUT_PREFERENCE },
    sidebar: createPaneState(320, 220, 520),
    inspector: createPaneState(320, 240, 520),
    bottomPanel: {
      open: false,
      height: 240,
      activeViewId: null,
    },
    activeGroupId: DEFAULT_GROUP_ID,
    layout: createRootGroup(),
    commandPaletteOpen: false,
    commandBarFocused: false,
    navigation: {
      back: [],
      forward: [],
    },
    ...clone(initialState),
  }
}

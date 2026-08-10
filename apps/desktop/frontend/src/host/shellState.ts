import type { WorkbenchShellState } from '@activelane/workbench-api'

export function createDesktopInitialShellState(): Partial<WorkbenchShellState> {
  const devTerminalBottomPanel = import.meta.env.DEV
    ? {
        open: true,
        height: 280,
        activeViewId: 'terminal.integrated',
      }
    : undefined

  return {
    activeActivityId: 'home.activity',
    activeSidebarViewId: 'home.sidebar',
    bottomPanel: devTerminalBottomPanel,
    inspector: {
      collapsed: true,
      size: 0,
      minSize: 240,
      minExpandedSize: 240,
      lastExpandedSize: 320,
      collapseThreshold: 80,
      maxSize: 520,
    },
  }
}

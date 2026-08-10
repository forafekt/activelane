import type { WorkbenchShellState } from '../../index'
import { findGroupNode } from './layout'

export function activeTabIdForState(state: WorkbenchShellState) {
  const group = findGroupNode(state.layout, state.activeGroupId)?.group
  return group?.activeTabId ?? group?.tabs[0]?.id ?? null
}

export function rememberNavigation(state: WorkbenchShellState, nextTabId: string) {
  const current = activeTabIdForState(state)
  if (!current || current === nextTabId) return
  state.navigation.back = [...state.navigation.back.filter((id) => id !== current), current].slice(
    -50,
  )
  state.navigation.forward = []
}

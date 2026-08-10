import type { WorkbenchPaneState } from '../../index'
import { clamp } from './utils'

export function createPaneState(
  size: number,
  minSize: number,
  maxSize?: number,
): WorkbenchPaneState {
  return {
    collapsed: false,
    size,
    minSize,
    minExpandedSize: minSize,
    lastExpandedSize: size,
    collapseThreshold: Math.max(72, Math.min(minSize - 32, 96)),
    maxSize,
  }
}

export function normalizePaneState(
  partial: Partial<WorkbenchPaneState> | undefined,
  fallback: WorkbenchPaneState,
): WorkbenchPaneState {
  const minSize = partial?.minSize ?? fallback.minSize
  const maxSize = partial?.maxSize ?? fallback.maxSize
  const minExpandedSize = partial?.minExpandedSize ?? partial?.minSize ?? fallback.minExpandedSize
  const lastExpandedSize =
    partial?.lastExpandedSize ??
    (partial?.size && partial.size > 0 ? partial.size : fallback.lastExpandedSize)
  const unclampedSize = partial?.size ?? fallback.size

  return {
    collapsed: partial?.collapsed ?? fallback.collapsed,
    minSize,
    minExpandedSize,
    lastExpandedSize: clamp(lastExpandedSize, minExpandedSize, maxSize ?? lastExpandedSize),
    collapseThreshold: partial?.collapseThreshold ?? fallback.collapseThreshold,
    maxSize,
    size:
      partial?.collapsed === true ||
      (partial?.collapsed == null && fallback.collapsed && unclampedSize === 0)
        ? 0
        : clamp(unclampedSize, minExpandedSize, maxSize ?? unclampedSize),
  }
}

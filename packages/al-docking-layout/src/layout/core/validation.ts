import { normalizeSizes, simplify } from './tree'
import {
  LAYOUT_VERSION,
  type LayoutNode,
  type PersistedLayout,
  type ValidationIssue,
} from './types'

export function validateTree(root: LayoutNode): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeIds = new Set<string>()
  const paneIds = new Set<string>()
  const visit = (node: LayoutNode) => {
    if (!node.id || nodeIds.has(node.id))
      issues.push({
        code: 'duplicate-node',
        message: `Duplicate or empty node id: ${node.id}`,
        nodeId: node.id,
      })
    nodeIds.add(node.id)
    if (node.kind === 'group') {
      for (const pane of node.tabs) {
        if (!pane.id || paneIds.has(pane.id))
          issues.push({
            code: 'duplicate-pane',
            message: `Duplicate or empty pane id: ${pane.id}`,
            nodeId: node.id,
          })
        paneIds.add(pane.id)
      }
      const hiddenIds = new Set(node.hiddenTabIds ?? [])
      if (
        hiddenIds.size !== (node.hiddenTabIds ?? []).length ||
        [...hiddenIds].some((id) => !node.tabs.some((pane) => pane.id === id))
      )
        issues.push({
          code: 'invalid-hidden-tabs',
          message: 'Hidden tab IDs must be unique tabs in their group',
          nodeId: node.id,
        })
      if (
        node.activeTabId !== null &&
        (!node.tabs.some((pane) => pane.id === node.activeTabId) || hiddenIds.has(node.activeTabId))
      )
        issues.push({
          code: 'invalid-active-tab',
          message: 'Active tab is not in its group',
          nodeId: node.id,
        })
      return
    }
    if (node.children.length < 2)
      issues.push({
        code: 'invalid-split',
        message: 'A split must have at least two children',
        nodeId: node.id,
      })
    if (
      node.sizes.length !== node.children.length ||
      node.sizes.some((size) => !Number.isFinite(size) || size <= 0)
    )
      issues.push({
        code: 'invalid-sizes',
        message: 'Split sizes must match children and be finite and positive',
        nodeId: node.id,
      })
    node.children.forEach(visit)
  }
  visit(root)
  return issues
}

export function repairTree(node: LayoutNode): LayoutNode {
  if (node.kind === 'group') {
    const seen = new Set<string>()
    node.tabs = node.tabs.filter((pane) =>
      Boolean(pane.id && pane.type && !seen.has(pane.id) && seen.add(pane.id)),
    )
    node.hiddenTabIds = [...new Set(node.hiddenTabIds ?? [])].filter((id) =>
      node.tabs.some((pane) => pane.id === id),
    )
    if (
      !node.tabs.some((pane) => pane.id === node.activeTabId) ||
      node.hiddenTabIds.includes(node.activeTabId ?? '')
    )
      node.activeTabId = node.tabs.find((pane) => !node.hiddenTabIds.includes(pane.id))?.id ?? null
    return node
  }
  const originalSizes = Array.isArray(node.sizes) ? node.sizes : []
  node.children = Array.isArray(node.children) ? node.children.map(repairTree) : []
  node.sizes = normalizeSizes(node.children.map((_, index) => originalSizes[index] ?? 1))
  // Persistence must never leave a one-child split (or an empty split) in the
  // live model; simplify also re-aligns sizes after malformed children are removed.
  return simplify(node)
}

export function isPersistedLayout(value: unknown): value is PersistedLayout {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PersistedLayout>
  return (
    candidate.version === LAYOUT_VERSION &&
    Boolean(candidate.root) &&
    Array.isArray(candidate.closed) &&
    Array.isArray(candidate.hiddenGroups) &&
    Array.isArray(candidate.collapsed) &&
    Array.isArray(candidate.snapshots)
  )
}

import { createId } from './ids'
import type { Direction, LayoutNode, PaneGroupNode, PaneInstance, SplitNode } from './types'

export const cloneNode = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const group = (
  tabs: PaneInstance[],
  options: Partial<PaneGroupNode> = {},
): PaneGroupNode => ({
  kind: 'group',
  id: options.id ?? createId('group'),
  tabs,
  activeTabId: options.activeTabId ?? tabs[0]?.id ?? null,
  hiddenTabIds: options.hiddenTabIds?.filter((id) => tabs.some((tab) => tab.id === id)) ?? [],
  header: options.header,
  location: options.location,
  minSize: options.minSize,
  maxSize: options.maxSize,
})

export const split = (
  direction: Direction,
  children: LayoutNode[],
  sizes?: number[],
  id = createId('split'),
): SplitNode => ({
  kind: 'split',
  id,
  direction,
  children,
  sizes: normalizeSizes(children.map((_, index) => sizes?.[index] ?? 1)),
})

export const walk = (
  node: LayoutNode,
  visit: (node: LayoutNode, parent: SplitNode | null, index: number) => void,
  parent: SplitNode | null = null,
  index = 0,
) => {
  visit(node, parent, index)
  if (node.kind === 'split')
    node.children.forEach((child, childIndex) => {
      walk(child, visit, node, childIndex)
    })
}

export const findNode = <T extends LayoutNode = LayoutNode>(root: LayoutNode, id: string) => {
  let found: LayoutNode | undefined
  walk(root, (node) => {
    if (node.id === id) found = node
  })
  return found as T | undefined
}

export const findParent = (root: LayoutNode, id: string) => {
  let result: { parent: SplitNode; index: number } | undefined
  walk(root, (node, parent, index) => {
    if (node.id === id && parent) result = { parent, index }
  })
  return result
}

export const groups = (root: LayoutNode) => {
  const result: PaneGroupNode[] = []
  walk(root, (node) => {
    if (node.kind === 'group') result.push(node)
  })
  return result
}

export const panes = (root: LayoutNode) => groups(root).flatMap((item) => item.tabs)

export function normalizeSizes(sizes: number[]) {
  if (!sizes.length) return []
  const safe = sizes.map((value) => (Number.isFinite(value) && value > 0 ? value : 1))
  const total = safe.reduce((sum, value) => sum + value, 0)
  return safe.map((value) => (value / total) * 100)
}

export function constrainBoundary(
  sizes: number[],
  index: number,
  deltaPercent: number,
  span: number,
  minA = 0,
  minB = 0,
  maxA = Number.POSITIVE_INFINITY,
  maxB = Number.POSITIVE_INFINITY,
) {
  if (index < 0 || index + 1 >= sizes.length || span <= 0) return sizes.slice()
  const pair = sizes[index] + sizes[index + 1]
  const minAPercent = (minA / span) * 100
  const minBPercent = (minB / span) * 100
  const maxAPercent = (maxA / span) * 100
  const maxBPercent = (maxB / span) * 100
  const nextA = Math.min(
    maxAPercent,
    Math.max(minAPercent, sizes[index] + deltaPercent, pair - maxBPercent),
    pair - minBPercent,
  )
  const result = sizes.slice()
  result[index] = nextA
  result[index + 1] = pair - nextA
  return normalizeSizes(result)
}

export function simplify(node: LayoutNode, allowEmptyRoot = true): LayoutNode {
  if (node.kind === 'group') {
    node.hiddenTabIds ??= []
    if (
      !node.tabs.some((pane) => pane.id === node.activeTabId) ||
      node.hiddenTabIds.includes(node.activeTabId ?? '')
    )
      node.activeTabId = node.tabs.find((pane) => !node.hiddenTabIds.includes(pane.id))?.id ?? null
    return node
  }
  const original = node.children.map((child, index) => ({
    child: simplify(child),
    size: node.sizes[index] ?? 1,
  }))
  const retained = original.filter(
    (item) => item.child.kind !== 'group' || item.child.tabs.length > 0,
  )
  if (!retained.length) return allowEmptyRoot ? group([], { id: createId('group') }) : node
  if (retained.length === 1) return retained[0].child
  node.children = retained.map((item) => item.child)
  node.sizes = normalizeSizes(retained.map((item) => item.size))
  return node
}

export function removeNode(
  root: LayoutNode,
  id: string,
): { root: LayoutNode; removed?: LayoutNode; parentId?: string; index?: number } {
  if (root.id === id) return { root, removed: root }
  const found = findParent(root, id)
  if (!found) return { root }
  const parentId = found.parent.id
  const [removed] = found.parent.children.splice(found.index, 1)
  found.parent.sizes.splice(found.index, 1)
  return { root: simplify(root), removed, parentId, index: found.index }
}

export function replaceNode(root: LayoutNode, id: string, replacement: LayoutNode): LayoutNode {
  if (root.id === id) return replacement
  const found = findParent(root, id)
  if (found) found.parent.children.splice(found.index, 1, replacement)
  return root
}

export function insertNear(
  root: LayoutNode,
  targetId: string,
  incoming: LayoutNode,
  side: 'before' | 'after',
  direction: Direction,
) {
  const target = findNode(root, targetId)
  if (!target || target.id === incoming.id) return root
  const parentInfo = findParent(root, targetId)
  if (parentInfo?.parent.direction === direction) {
    const at = parentInfo.index + (side === 'after' ? 1 : 0)
    const targetSize = parentInfo.parent.sizes[parentInfo.index] ?? 1
    parentInfo.parent.children.splice(at, 0, incoming)
    parentInfo.parent.sizes[parentInfo.index] = targetSize / 2
    parentInfo.parent.sizes.splice(at, 0, targetSize / 2)
    parentInfo.parent.sizes = normalizeSizes(parentInfo.parent.sizes)
    return root
  }
  return replaceNode(
    root,
    targetId,
    split(direction, side === 'before' ? [incoming, target] : [target, incoming], [50, 50]),
  )
}

export function containsNode(root: LayoutNode, id: string) {
  return Boolean(findNode(root, id))
}

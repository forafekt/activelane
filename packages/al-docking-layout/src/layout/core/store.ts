import { computed, type InjectionKey, reactive, readonly } from 'vue'
import { GroupActionRegistry, PaneActionRegistry } from './actions'
import { LayoutEvents } from './events'
import { createId } from './ids'
import type { PaneRegistry } from './registry'
import {
  cloneNode,
  constrainBoundary,
  findNode,
  findParent,
  group,
  groups,
  insertNear,
  normalizeSizes,
  panes,
  removeNode,
  simplify,
} from './tree'
import {
  type DockPosition,
  type Edge,
  LAYOUT_VERSION,
  type LayoutNode,
  type OpenPolicy,
  type PaneGroupNode,
  type PaneInstance,
  type PersistedLayout,
  type SemanticLocation,
  type StoredPane,
} from './types'
import { isPersistedLayout, repairTree, validateTree } from './validation'

export interface LayoutStoreOptions {
  root: LayoutNode
  registry: PaneRegistry
  storageKey?: string
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  onError?: (error: unknown) => void
}

export class LayoutStore {
  readonly events = new LayoutEvents()
  readonly actions = new PaneActionRegistry()
  readonly groupActions = new GroupActionRegistry()
  readonly registry: PaneRegistry
  readonly state: PersistedLayout
  readonly visibleGroups
  private readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  private readonly storageKey?: string
  private readonly onError?: (error: unknown) => void
  private transactionDepth = 0
  private beforeTransaction?: PersistedLayout

  constructor(options: LayoutStoreOptions) {
    this.registry = options.registry
    this.storageKey = options.storageKey
    this.storage =
      options.storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
    this.onError = options.onError
    this.state = reactive<PersistedLayout>({
      version: LAYOUT_VERSION,
      root: repairTree(cloneNode(options.root)),
      closed: [],
      hiddenGroups: [],
      collapsed: [],
      fullscreenGroupId: null,
      snapshots: [],
    })
    this.visibleGroups = computed(() => groups(this.state.root))
    this.assertValid()
  }
  snapshot(): PersistedLayout {
    return cloneNode(this.state)
  }
  serialize() {
    return JSON.stringify(this.snapshot(), null, 2)
  }
  restore(serialized: string | PersistedLayout) {
    const parsed: unknown = typeof serialized === 'string' ? JSON.parse(serialized) : serialized
    const next = migrateLayout(parsed)
    if (!isPersistedLayout(next)) throw new Error('Invalid or unsupported docking layout')
    next.root = repairTree(next.root)
    const issues = validateTree(next.root)
    if (issues.length)
      throw new Error(`Invalid docking layout: ${issues.map((issue) => issue.message).join('; ')}`)
    Object.assign(this.state, cloneNode(next))
    this.cleanupReferences()
    this.changed('restore')
  }
  save() {
    if (!this.storageKey || !this.storage) return
    try {
      this.storage.setItem(this.storageKey, this.serialize())
    } catch (error) {
      this.onError?.(error)
    }
  }
  load() {
    if (!this.storageKey || !this.storage) return false
    const value = this.storage.getItem(this.storageKey)
    if (!value) return false
    this.restore(value)
    return true
  }
  reset(root: LayoutNode) {
    this.transaction('reset', () =>
      Object.assign(this.state, {
        version: LAYOUT_VERSION,
        root: repairTree(cloneNode(root)),
        closed: [],
        hiddenGroups: [],
        collapsed: [],
        fullscreenGroupId: null,
        snapshots: [],
      }),
    )
  }
  validate() {
    return validateTree(this.state.root)
  }

  transaction<T>(name: string, mutate: () => T): T {
    const outermost = this.transactionDepth === 0
    if (outermost) {
      this.beforeTransaction = this.snapshot()
      this.events.emit('transaction', { name, phase: 'begin' })
    }
    this.transactionDepth++
    try {
      const value = mutate()
      this.transactionDepth--
      if (outermost) {
        this.state.root = simplify(this.state.root)
        this.cleanupReferences()
        this.assertValid()
        this.events.emit('transaction', { name, phase: 'commit' })
        this.changed(name)
        this.beforeTransaction = undefined
      }
      return value
    } catch (error) {
      this.transactionDepth--
      if (outermost && this.beforeTransaction) {
        Object.assign(this.state, cloneNode(this.beforeTransaction))
        this.events.emit('transaction', { name, phase: 'rollback' })
        this.beforeTransaction = undefined
      }
      throw error
    }
  }

  findPane(resourceId: string, type?: string) {
    return panes(this.state.root).find(
      (pane) => pane.resourceId === resourceId && (!type || pane.type === type),
    )
  }
  open(
    type: string,
    options: Partial<Omit<PaneInstance, 'type'>> & {
      policy?: OpenPolicy
      location?: SemanticLocation
    } = {},
  ) {
    const policy = options.policy ?? 'reuse'
    const candidate = this.registry.create(type, options)
    const existing = this.registry.chooseExisting(panes(this.state.root), candidate, policy)
    if (existing) {
      const owner = this.ownerOf(existing.id)
      if (owner?.hiddenTabIds.includes(existing.id)) this.show(existing.id)
      else if (owner) this.activate(owner.id, existing.id)
      return existing
    }
    return this.transaction('open-pane', () => {
      const target =
        this.groupAt(options.location ?? this.registry.get(type)?.defaultLocation ?? 'primary') ??
        groups(this.state.root)[0]
      if (!target) this.state.root = group([candidate], { location: options.location })
      else {
        target.tabs.push(candidate)
        target.activeTabId = candidate.id
      }
      const owner = this.ownerOf(candidate.id)
      this.registry.get(type)?.onOpen?.(candidate, { reason: 'open', groupId: owner?.id })
      this.events.emit('paneOpen', { pane: candidate, groupId: owner?.id ?? this.state.root.id })
      return candidate
    })
  }
  activate(groupId: string, paneId: string) {
    const target = findNode<PaneGroupNode>(this.state.root, groupId)
    const pane =
      target?.kind === 'group' ? target.tabs.find((item) => item.id === paneId) : undefined
    if (!target || !pane || target.hiddenTabIds.includes(paneId)) return false
    target.activeTabId = paneId
    this.registry.get(pane.type)?.onActivate?.(pane, { reason: 'activate', groupId })
    this.events.emit('paneActivate', { pane, groupId })
    return true
  }
  closePane(paneId: string) {
    return this.removePane(paneId, 'closed')
  }
  hidePane(paneId: string) {
    return this.transaction('hide-tab', () => {
      const owner = this.ownerOf(paneId)
      const index = owner?.tabs.findIndex((pane) => pane.id === paneId) ?? -1
      if (!owner || index < 0 || owner.hiddenTabIds.includes(paneId)) return false
      const pane = owner.tabs[index]
      owner.hiddenTabIds.push(paneId)
      if (owner.activeTabId === paneId) {
        const visible = owner.tabs.filter((tab) => !owner.hiddenTabIds.includes(tab.id))
        owner.activeTabId =
          visible.find((tab) => owner.tabs.indexOf(tab) >= index)?.id ?? visible.at(-1)?.id ?? null
      }
      this.registry.get(pane.type)?.onHide?.(pane, { reason: 'hide', groupId: owner.id })
      this.events.emit('tabHide', { pane, groupId: owner.id })
      return true
    })
  }
  private removePane(paneId: string, destination: 'closed') {
    return this.transaction('close-tab', () => {
      const owner = this.ownerOf(paneId)
      const index = owner?.tabs.findIndex((pane) => pane.id === paneId) ?? -1
      if (!owner || index < 0) return false
      const pane = owner.tabs[index]
      if (destination === 'closed' && pane.closable === false) return false
      owner.tabs.splice(index, 1)
      const remainingVisible = owner.tabs.filter((tab) => !owner.hiddenTabIds.includes(tab.id))
      owner.activeTabId =
        remainingVisible.find((tab) => owner.tabs.indexOf(tab) >= index)?.id ??
        remainingVisible.at(-1)?.id ??
        null
      owner.hiddenTabIds = owner.hiddenTabIds.filter((id) => id !== paneId)
      const stored: StoredPane = {
        pane,
        previousGroupId: owner.id,
        previousLocation: owner.location,
      }
      this.state.closed.unshift(stored)
      this.registry.get(pane.type)?.onClose?.(pane, { reason: 'close', groupId: owner.id })
      this.events.emit('paneClose', { pane, groupId: owner.id })
      return true
    })
  }
  reopen(paneId?: string) {
    return this.restoreStored(paneId)
  }
  show(paneId?: string) {
    const owner = groups(this.state.root).find((group) =>
      group.hiddenTabIds.includes(paneId ?? group.hiddenTabIds[0] ?? ''),
    )
    const id = paneId ?? owner?.hiddenTabIds[0]
    if (!owner || !id) return undefined
    return this.transaction('show-tab', () => {
      owner.hiddenTabIds = owner.hiddenTabIds.filter((hiddenId) => hiddenId !== id)
      const pane = owner.tabs.find((tab) => tab.id === id)
      if (!pane) return undefined
      owner.activeTabId = id
      this.events.emit('tabShow', { pane, groupId: owner.id })
      this.registry.get(pane.type)?.onOpen?.(pane, { reason: 'show', groupId: owner.id })
      return pane
    })
  }
  private restoreStored(paneId?: string) {
    const index = paneId ? this.state.closed.findIndex((item) => item.pane.id === paneId) : 0
    if (index < 0 || !this.state.closed[index]) return undefined
    return this.transaction('reopen-tab', () => {
      const [stored] = this.state.closed.splice(index, 1)
      const target =
        findNode<PaneGroupNode>(this.state.root, stored.previousGroupId ?? '') ??
        this.groupAt(stored.previousLocation ?? 'primary') ??
        groups(this.state.root)[0]
      if (target?.kind === 'group') {
        target.tabs.push(stored.pane)
        target.activeTabId = stored.pane.id
      } else this.state.root = group([stored.pane], { location: stored.previousLocation })
      const owner = this.ownerOf(stored.pane.id)
      this.registry.get(stored.pane.type)?.onOpen?.(stored.pane, {
        reason: 'reopen',
        groupId: owner?.id,
      })
      this.events.emit('paneOpen', { pane: stored.pane, groupId: owner?.id ?? this.state.root.id })
      return stored.pane
    })
  }
  dispose(paneId: string) {
    return this.transaction('dispose-pane', () => {
      const visible = this.ownerOf(paneId)
      let pane: PaneInstance | undefined
      if (visible) {
        const index = visible.tabs.findIndex((item) => item.id === paneId)
        pane = visible.tabs.splice(index, 1)[0]
        visible.hiddenTabIds = visible.hiddenTabIds.filter((id) => id !== paneId)
        visible.activeTabId =
          visible.tabs.find((tab) => !visible.hiddenTabIds.includes(tab.id))?.id ?? null
      }
      const closedIndex = this.state.closed.findIndex((item) => item.pane.id === paneId)
      if (closedIndex >= 0) pane = this.state.closed.splice(closedIndex, 1)[0].pane
      if (!pane) return false
      this.registry.get(pane.type)?.onDispose?.(pane, { reason: 'dispose', groupId: visible?.id })
      this.events.emit('paneDispose', { pane })
      return true
    })
  }
  disposeClosed(paneId: string) {
    return this.dispose(paneId)
  }
  reorder(groupId: string, paneId: string, toIndex: number) {
    return this.transaction('reorder-tab', () => {
      const target = findNode<PaneGroupNode>(this.state.root, groupId)
      if (target?.kind !== 'group') return false
      const from = target.tabs.findIndex((item) => item.id === paneId)
      if (from < 0) return false
      const [pane] = target.tabs.splice(from, 1)
      target.tabs.splice(Math.max(0, Math.min(toIndex, target.tabs.length)), 0, pane)
      const finalIndex = target.tabs.findIndex((item) => item.id === paneId)
      this.events.emit('tabReorder', { paneId, groupId, fromIndex: from, toIndex: finalIndex })
      return true
    })
  }

  dock(
    sourceGroupId: string,
    paneId: string | undefined,
    targetGroupId: string,
    position: DockPosition,
    tabIndex?: number,
  ) {
    if (sourceGroupId === targetGroupId && !paneId) return false
    if (sourceGroupId === targetGroupId && paneId && position === 'center') {
      if (tabIndex === undefined) return false
      const source = findNode<PaneGroupNode>(this.state.root, sourceGroupId)
      const from = source?.tabs.findIndex((pane) => pane.id === paneId) ?? -1
      if (from < 0) return false
      return this.reorder(sourceGroupId, paneId, tabIndex > from ? tabIndex - 1 : tabIndex)
    }
    return this.transaction('dock', () => {
      const source = findNode<PaneGroupNode>(this.state.root, sourceGroupId)
      const targetBefore = findNode<PaneGroupNode>(this.state.root, targetGroupId)
      if (source?.kind !== 'group' || !targetBefore || targetBefore.kind !== 'group') return false
      let incoming: PaneGroupNode
      let movedPane: PaneInstance | undefined
      if (paneId) {
        const index = source.tabs.findIndex((item) => item.id === paneId)
        if (index < 0) return false
        movedPane = source.tabs.splice(index, 1)[0]
        source.hiddenTabIds = source.hiddenTabIds.filter((id) => id !== movedPane?.id)
        const sourceVisible = source.tabs.filter((tab) => !source.hiddenTabIds.includes(tab.id))
        source.activeTabId =
          sourceVisible.find((tab) => source.tabs.indexOf(tab) >= index)?.id ??
          sourceVisible.at(-1)?.id ??
          null
        incoming = group([movedPane], { location: targetBefore.location })
        if (!source.tabs.length) this.state.root = removeNode(this.state.root, source.id).root
      } else {
        incoming = cloneNode(source)
        this.state.root = removeNode(this.state.root, source.id).root
      }
      const target = findNode<PaneGroupNode>(this.state.root, targetGroupId)
      if (target?.kind !== 'group') throw new Error('Dock target disappeared during transaction')
      if (position === 'center') {
        const insertAt =
          tabIndex === undefined
            ? target.tabs.length
            : Math.max(0, Math.min(tabIndex, target.tabs.length))
        target.tabs.splice(insertAt, 0, ...incoming.tabs)
        target.hiddenTabIds.push(...incoming.hiddenTabIds)
        target.activeTabId =
          movedPane?.id ?? incoming.activeTabId ?? incoming.tabs[0]?.id ?? target.activeTabId
      } else {
        const direction = position === 'left' || position === 'right' ? 'row' : 'column'
        const side = position === 'left' || position === 'top' ? 'before' : 'after'
        this.state.root = insertNear(this.state.root, target.id, incoming, side, direction)
      }
      if (movedPane)
        this.events.emit('paneMove', {
          pane: movedPane,
          fromGroupId: sourceGroupId,
          toGroupId: position === 'center' ? targetGroupId : incoming.id,
        })
      else
        this.events.emit('groupMove', {
          groupId: sourceGroupId,
          fromParentId: findParent(this.beforeTransaction?.root ?? this.state.root, sourceGroupId)
            ?.parent.id,
          toGroupId: targetGroupId,
          position,
        })
      return true
    })
  }

  moveTab(sourceGroupId: string, paneId: string, targetGroupId: string, insertionIndex: number) {
    return this.dock(sourceGroupId, paneId, targetGroupId, 'center', insertionIndex)
  }
  moveGroup(sourceGroupId: string, targetGroupId: string, position: DockPosition) {
    return this.dock(sourceGroupId, undefined, targetGroupId, position)
  }

  collapse(groupId: string, edge: Edge) {
    return this.transaction('collapse-group', () => {
      if (groups(this.state.root).length <= 1) return false
      const node = findNode<PaneGroupNode>(this.state.root, groupId)
      if (node?.kind !== 'group' || this.state.collapsed.some((item) => item.group.id === groupId))
        return false
      const parent = findParent(this.state.root, groupId)
      const result = removeNode(this.state.root, groupId)
      if (result.removed?.kind !== 'group') return false
      this.state.root = result.root
      this.state.collapsed.push({
        group: result.removed,
        edge,
        previousParentId: parent?.parent.id,
        previousIndex: parent?.index,
      })
      return true
    })
  }
  expand(groupId: string) {
    return this.transaction('expand-group', () => {
      const index = this.state.collapsed.findIndex((item) => item.group.id === groupId)
      if (index < 0) return false
      const [item] = this.state.collapsed.splice(index, 1)
      const anchor = this.groupAt(item.group.location ?? 'primary') ?? groups(this.state.root)[0]
      if (!anchor) this.state.root = item.group
      else
        this.state.root = insertNear(
          this.state.root,
          anchor.id,
          item.group,
          item.edge === 'left' || item.edge === 'top' ? 'before' : 'after',
          item.edge === 'left' || item.edge === 'right' ? 'row' : 'column',
        )
      return true
    })
  }
  hideGroup(groupId: string) {
    return this.transaction('hide-group', () => {
      if (groups(this.state.root).length <= 1) return false
      const parent = findParent(this.state.root, groupId)
      const result = removeNode(this.state.root, groupId)
      if (result.removed?.kind !== 'group') return false
      this.state.root = result.root
      this.state.hiddenGroups.push({
        group: result.removed,
        previousParentId: parent?.parent.id,
        previousIndex: parent?.index,
        previousLocation: result.removed.location,
      })
      this.events.emit('groupHide', { groupId })
      return true
    })
  }
  showGroup(groupId: string) {
    return this.transaction('show-group', () => {
      const index = this.state.hiddenGroups.findIndex((item) => item.group.id === groupId)
      if (index < 0) return false
      const [item] = this.state.hiddenGroups.splice(index, 1)
      const anchor = this.groupAt(item.previousLocation ?? 'primary') ?? groups(this.state.root)[0]
      if (!anchor) this.state.root = item.group
      else
        this.state.root = insertNear(
          this.state.root,
          anchor.id,
          item.group,
          'after',
          item.previousLocation === 'panel' ? 'column' : 'row',
        )
      this.events.emit('groupShow', { groupId })
      return true
    })
  }
  toggleFullscreen(groupId: string) {
    if (!findNode(this.state.root, groupId)) return false
    this.state.fullscreenGroupId = this.state.fullscreenGroupId === groupId ? null : groupId
    this.events.emit('fullscreenChange', { groupId: this.state.fullscreenGroupId })
    this.changed('fullscreen')
    return true
  }
  setSizes(splitId: string, sizes: number[]) {
    const node = findNode(this.state.root, splitId)
    if (node?.kind !== 'split' || sizes.length !== node.children.length) return false
    node.sizes = normalizeSizes(sizes)
    this.events.emit('resize', { splitId, sizes: [...node.sizes] })
    this.changed('resize')
    return true
  }
  resizeBoundary(
    splitId: string,
    index: number,
    deltaPercent: number,
    span: number,
    minA?: number,
    minB?: number,
    maxA?: number,
    maxB?: number,
  ) {
    const node = findNode(this.state.root, splitId)
    if (node?.kind !== 'split') return false
    return this.setSizes(
      splitId,
      constrainBoundary(node.sizes, index, deltaPercent, span, minA, minB, maxA, maxB),
    )
  }
  equalize(splitId: string) {
    const node = findNode(this.state.root, splitId)
    return node?.kind === 'split'
      ? this.setSizes(
          splitId,
          node.children.map(() => 1),
        )
      : false
  }
  saveResizeSnapshot(label = 'Snapshot') {
    this.state.snapshots.unshift({
      id: createId('snapshot'),
      label,
      root: cloneNode(this.state.root),
      createdAt: Date.now(),
    })
    this.changed('save-resize-snapshot')
  }
  restoreResizeSnapshot(id: string) {
    const item = this.state.snapshots.find((snapshot) => snapshot.id === id)
    if (!item) return false
    this.transaction('restore-resize-snapshot', () => {
      this.state.root = repairTree(cloneNode(item.root))
    })
    return true
  }
  collapsedAt(edge: Edge) {
    return this.state.collapsed.filter((item) => item.edge === edge)
  }
  groupAt(location: SemanticLocation) {
    return groups(this.state.root).find((item) => item.location === location)
  }
  readonly() {
    return readonly(this.state)
  }
  private ownerOf(paneId: string) {
    return groups(this.state.root).find((item) => item.tabs.some((tab) => tab.id === paneId))
  }
  private cleanupReferences() {
    if (this.state.fullscreenGroupId && !findNode(this.state.root, this.state.fullscreenGroupId))
      this.state.fullscreenGroupId = null
  }
  private assertValid() {
    const issues = validateTree(this.state.root)
    if (issues.length) throw new Error(issues.map((issue) => issue.message).join('; '))
  }
  private changed(reason: string) {
    if (this.transactionDepth) return
    this.save()
    this.events.emit('change', { reason, state: this.snapshot() })
  }
}

function migrateLayout(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const legacy = value as Record<string, unknown>
  if (legacy.version === 1) legacy.hidden = []
  if (legacy.version === 1 || legacy.version === 2) {
    const root = repairTree(cloneNode(legacy.root as LayoutNode))
    for (const stored of (legacy.hidden as StoredPane[] | undefined) ?? []) {
      const target = findNode<PaneGroupNode>(root, stored.previousGroupId ?? '') ?? groups(root)[0]
      if (target?.kind === 'group') {
        target.tabs.push(stored.pane)
        target.hiddenTabIds.push(stored.pane.id)
      }
    }
    return { ...legacy, version: LAYOUT_VERSION, root, hiddenGroups: [], hidden: undefined }
  }
  return value
}

export const layoutStoreKey: InjectionKey<LayoutStore> = Symbol('activelane-docking-layout-store')

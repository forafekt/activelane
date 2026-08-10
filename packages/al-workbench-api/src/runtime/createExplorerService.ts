import type {
  ExplorerNode,
  ExplorerNodeState,
  ExplorerProvider,
  ExplorerProviderState,
  ExplorerRuntime,
  ExplorerState,
} from '../explorer/types'
import type { WorkbenchStorageScope } from '../host/types'
import type { Disposable } from '../shared/types'
import { resolveWorkbenchReactivity, type WorkbenchReactivityAdapter } from './reactivity'

const EXPLORER_STORAGE_KEY = 'explorer.state.v1'
const ROOT_NODE_ID = '__root__'

interface PersistedExplorerState {
  expandedProviders: string[]
  expandedNodes: Array<{ providerId: string; nodeId: string }>
  selectedProviderId?: string
  selectedNodeId?: string
  focusedProviderId?: string
  focusedNodeId?: string
}

const defaultPersistedState: PersistedExplorerState = {
  expandedProviders: [],
  expandedNodes: [],
}

function childrenKey(providerId: string, nodeId = ROOT_NODE_ID) {
  return `${providerId}::${nodeId}`
}

function nodeKey(providerId: string, nodeId: string) {
  return `${providerId}::${nodeId}`
}

function normalizeProvider(
  provider: ExplorerProvider,
  markRaw: <T>(value: T) => T,
): ExplorerProvider {
  return markRaw({ ...provider, canCollapse: provider.canCollapse ?? true })
}

function normalizeNode(
  node: ExplorerNode,
  providerId: string,
  markRaw: <T>(value: T) => T,
): ExplorerNode {
  return markRaw({
    ...node,
    providerId: node.providerId ?? providerId,
    isLeaf: node.isLeaf ?? node.collapsible === false,
  })
}

function sortProviders(providers: ExplorerProvider[]) {
  providers.sort(
    (left, right) =>
      (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title),
  )
}

export async function createExplorerService(
  storage: WorkbenchStorageScope | undefined,
  reactivity?: Partial<WorkbenchReactivityAdapter>,
): Promise<ExplorerRuntime> {
  const reactivityAdapter = resolveWorkbenchReactivity(reactivity)
  const reactive = reactivityAdapter.reactive
  const markRaw = reactivityAdapter.markRaw
  const persisted =
    (await storage?.get<PersistedExplorerState>(EXPLORER_STORAGE_KEY)) ?? defaultPersistedState
  const state = reactive<ExplorerState>({
    providers: [],
    providerState: {},
    nodes: {},
    children: {},
    nodeState: {},
    selectedProviderId: persisted.selectedProviderId,
    selectedNodeId: persisted.selectedNodeId,
    focusedProviderId: persisted.focusedProviderId,
    focusedNodeId: persisted.focusedNodeId,
  })
  let persistTimer: number | null = null
  let revealNonce = 0
  const loadVersions = new Map<string, number>()

  function schedulePersist() {
    if (!storage) return
    if (persistTimer) globalThis.clearTimeout(persistTimer)
    persistTimer = globalThis.setTimeout(() => {
      void storage.set(EXPLORER_STORAGE_KEY, {
        expandedProviders: Object.values(state.providerState)
          .filter((item) => item.expanded)
          .map((item) => item.id),
        expandedNodes: Object.values(state.nodeState)
          .filter((item) => item.expanded)
          .map((item) => ({ providerId: item.providerId, nodeId: item.nodeId })),
        selectedProviderId: state.selectedProviderId,
        selectedNodeId: state.selectedNodeId,
        focusedProviderId: state.focusedProviderId,
        focusedNodeId: state.focusedNodeId,
      } satisfies PersistedExplorerState)
      persistTimer = null
    }, 500) as unknown as number
  }

  function ensureProviderState(providerId: string): ExplorerProviderState {
    state.providerState[providerId] ??= {
      id: providerId,
      expanded: persisted.expandedProviders.length
        ? persisted.expandedProviders.includes(providerId)
        : true,
      loading: false,
    }
    return state.providerState[providerId]
  }

  function ensureNodeState(providerId: string, id: string): ExplorerNodeState {
    const key = nodeKey(providerId, id)
    state.nodeState[key] ??= {
      providerId,
      nodeId: id,
      expanded: persisted.expandedNodes.some(
        (item) => item.providerId === providerId && item.nodeId === id,
      ),
      loading: false,
    }
    return state.nodeState[key]
  }

  async function loadChildren(providerId: string, node?: ExplorerNode, force = false) {
    const provider = state.providers.find((item) => item.id === providerId)
    if (!provider) return []
    const key = childrenKey(providerId, node?.id)
    if (!force && state.children[key]) return state.children[key]
    const target = node ? ensureNodeState(providerId, node.id) : ensureProviderState(providerId)
    const version = (loadVersions.get(key) ?? 0) + 1
    loadVersions.set(key, version)
    target.loading = true
    target.error = undefined
    try {
      const children = (await provider.getChildren(node)).map((child) =>
        normalizeNode(child, providerId, markRaw),
      )
      if (loadVersions.get(key) !== version) return state.children[key] ?? []
      state.children[key]?.forEach((child) => {
        delete state.nodes[nodeKey(providerId, child.id)]
      })
      state.children[key] = markRaw(children)
      children.forEach((child) => {
        state.nodes[nodeKey(providerId, child.id)] = child
        if (!child.isLeaf) ensureNodeState(providerId, child.id)
      })
      return children
    } catch (error) {
      if (loadVersions.get(key) !== version) return state.children[key] ?? []
      target.error = error instanceof Error ? error.message : String(error)
      state.children[key] = markRaw([])
      return []
    } finally {
      if (loadVersions.get(key) === version) target.loading = false
    }
  }

  function findLoadedNode(providerId: string, id?: string) {
    if (!id) return undefined
    return state.nodes[nodeKey(providerId, id)]
  }

  function unregisterProvider(id: string) {
    const index = state.providers.findIndex((item) => item.id === id)
    if (index >= 0) state.providers.splice(index, 1)
    delete state.providerState[id]
    Object.keys(state.children).forEach((key) => {
      if (key.startsWith(`${id}::`)) delete state.children[key]
    })
    Object.keys(state.nodes).forEach((key) => {
      if (key.startsWith(`${id}::`)) delete state.nodes[key]
    })
    Object.keys(state.nodeState).forEach((key) => {
      if (key.startsWith(`${id}::`)) delete state.nodeState[key]
    })
    schedulePersist()
  }

  const service: ExplorerRuntime = {
    state,
    registerProvider(provider: ExplorerProvider): Disposable {
      const normalized = normalizeProvider(provider, markRaw)
      unregisterProvider(normalized.id)
      state.providers.push(normalized)
      sortProviders(state.providers)
      ensureProviderState(normalized.id)
      void loadChildren(normalized.id)
      schedulePersist()
      return { dispose: () => unregisterProvider(normalized.id) }
    },
    unregisterProvider,
    getProviders: () => [...state.providers],
    refresh(providerId?: string, nodeId?: string) {
      const providers = providerId
        ? state.providers.filter((provider) => provider.id === providerId)
        : state.providers
      providers.forEach((provider) => {
        provider.refresh?.()
        delete state.children[childrenKey(provider.id, nodeId)]
        void loadChildren(provider.id, findLoadedNode(provider.id, nodeId), true)
      })
    },
    async reveal(uri: string) {
      const node = Object.values(state.nodes).find((candidate) => candidate.uri === uri)
      state.revealRequest = {
        uri,
        providerId: node?.providerId,
        nodeId: node?.id,
        nonce: ++revealNonce,
      }
      if (node?.providerId) {
        service.select(node, node.providerId)
        service.focus(node, node.providerId)
      }
    },
    expand(nodeId: string, providerId = state.focusedProviderId ?? state.selectedProviderId) {
      if (!providerId) return
      ensureNodeState(providerId, nodeId).expanded = true
      schedulePersist()
    },
    collapse(nodeId: string, providerId = state.focusedProviderId ?? state.selectedProviderId) {
      if (!providerId) return
      ensureNodeState(providerId, nodeId).expanded = false
      schedulePersist()
    },
    setProviderExpanded(providerId: string, expanded: boolean) {
      ensureProviderState(providerId).expanded = expanded
      schedulePersist()
    },
    async toggle(node: ExplorerNode, providerId = node.providerId) {
      if (!providerId || node.isLeaf || node.collapsible === false) return
      const target = ensureNodeState(providerId, node.id)
      target.expanded = !target.expanded
      if (target.expanded && !state.children[childrenKey(providerId, node.id)]) {
        await loadChildren(providerId, node)
      }
      schedulePersist()
    },
    loadChildren,
    select(node, providerId = node?.providerId) {
      if (state.selectedProviderId === providerId && state.selectedNodeId === node?.id) return
      state.selectedProviderId = providerId
      state.selectedNodeId = node?.id
      schedulePersist()
    },
    focus(node, providerId = node?.providerId) {
      if (state.focusedProviderId === providerId && state.focusedNodeId === node?.id) return
      state.focusedProviderId = providerId
      state.focusedNodeId = node?.id
      schedulePersist()
    },
    collapseAll(providerId?: string) {
      Object.values(state.nodeState).forEach((item) => {
        if (!providerId || item.providerId === providerId) item.expanded = false
      })
      schedulePersist()
    },
    isExpanded(node, providerId = node.providerId) {
      return providerId ? (state.nodeState[nodeKey(providerId, node.id)]?.expanded ?? false) : false
    },
    getChildren(providerId, nodeId) {
      return state.children[childrenKey(providerId, nodeId)]
    },
    getNode(providerId, nodeId) {
      return state.nodes[nodeKey(providerId, nodeId)]
    },
  }

  return service
}

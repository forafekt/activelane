import type { Disposable, MaybePromise } from '../shared/types'

export interface ExplorerNode {
  id: string
  providerId?: string
  label: string
  description?: string
  icon?: string
  uri?: string
  resourceType?: string
  contextValue?: string
  collapsible?: boolean
  isLeaf?: boolean
  tooltip?: string
  badge?: string | number
  disabled?: boolean
  metadata?: Record<string, unknown>
}

export interface ExplorerProvider {
  id: string
  title: string
  icon?: string
  order?: number
  canCollapse?: boolean
  getChildren(node?: ExplorerNode): MaybePromise<ExplorerNode[]>
  getParent?(node: ExplorerNode): MaybePromise<ExplorerNode | undefined>
  refresh?(): void
}

export interface ExplorerProviderState {
  id: string
  expanded: boolean
  loading: boolean
  error?: string
}

export interface ExplorerNodeState {
  providerId: string
  nodeId: string
  expanded: boolean
  loading: boolean
  error?: string
}

export interface ExplorerState {
  providers: ExplorerProvider[]
  providerState: Record<string, ExplorerProviderState>
  nodes: Record<string, ExplorerNode>
  children: Record<string, ExplorerNode[]>
  nodeState: Record<string, ExplorerNodeState>
  selectedNodeId?: string
  selectedProviderId?: string
  focusedNodeId?: string
  focusedProviderId?: string
  revealRequest?: {
    uri: string
    providerId?: string
    nodeId?: string
    nonce: number
  }
}

export interface ExplorerRuntime {
  state: ExplorerState
  registerProvider(provider: ExplorerProvider): Disposable
  unregisterProvider(id: string): void
  getProviders(): ExplorerProvider[]
  refresh(providerId?: string, nodeId?: string): void
  reveal(uri: string): Promise<void>
  expand(nodeId: string, providerId?: string): void
  collapse(nodeId: string, providerId?: string): void
  setProviderExpanded(providerId: string, expanded: boolean): void
  toggle(node: ExplorerNode, providerId?: string): Promise<void>
  loadChildren(providerId: string, node?: ExplorerNode): Promise<ExplorerNode[]>
  select(node: ExplorerNode | undefined, providerId?: string): void
  focus(node: ExplorerNode | undefined, providerId?: string): void
  collapseAll(providerId?: string): void
  isExpanded(node: ExplorerNode, providerId?: string): boolean
  getChildren(providerId: string, nodeId?: string): ExplorerNode[] | undefined
  getNode(providerId: string, nodeId: string): ExplorerNode | undefined
}

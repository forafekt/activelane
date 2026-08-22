import type { IconReference } from '@activelane/icons'

export type ViewLocation =
  | 'primary-sidebar'
  | 'secondary-sidebar'
  | 'editor'
  | 'panel'
  | 'auxiliary'

export interface ViewContainer {
  id: string
  title: string
  location: ViewLocation
  icon?: IconReference
  order?: number
  ownerExtensionId?: string
}

export interface NativeViewRenderer {
  type: 'native'
  component: unknown
}

export interface IsolatedViewRenderer {
  type: 'isolated'
  entry: string
}

export type ViewRenderer = NativeViewRenderer | IsolatedViewRenderer

export interface ViewDefinition {
  id: string
  title: string
  container: string
  renderer: ViewRenderer
  capabilities?: string[]
  multiple?: boolean
  order?: number
  ownerExtensionId?: string
}

export interface ViewInstance<TContext = unknown> {
  id: string
  definitionId: string
  extensionId: string
  title: string
  context?: TContext
  dirty: boolean
  createdAt: number
}

export interface CreateViewInstanceInput<TContext = unknown> {
  definitionId: string
  extensionId: string
  title?: string
  context?: TContext
  instanceId?: string
}

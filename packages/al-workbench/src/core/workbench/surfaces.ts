import type { ViewDefinition } from '../../views/model'
import type { WorkbenchRuntimeApi } from '../runtime/types'
import type { MaybePromise } from '../shared/types'
import type { WorkbenchTab, WorkbenchTabContext } from './contributions'
import type { WorkbenchComponent } from './ui'

export type WorkbenchSurfaceMode = 'native-vue' | 'webview' | 'isolated'

export type WorkbenchSurfaceLifecycleEventType = 'ready' | 'error' | 'dispose' | 'focus' | 'load'

export interface WorkbenchSurfaceLifecycleEvent<TPayload = unknown> {
  type: WorkbenchSurfaceLifecycleEventType
  surfaceId: string
  ownerExtensionId?: string
  payload?: TPayload
  timestamp: string
}

export interface WorkbenchSurfaceFallback {
  title?: string
  message?: string
  retryable?: boolean
}

export interface WorkbenchSurfaceDescriptorBase {
  id: string
  ownerExtensionId?: string
  title?: string
  component?: WorkbenchComponent
  props?: Record<string, unknown>
  passThrough?: Record<string, unknown>
  fallback?: WorkbenchSurfaceFallback
}

export interface WorkbenchNativeVueSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'native-vue'
}

export interface WorkbenchWebviewSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'webview'
}

export interface WorkbenchIsolatedSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'isolated'
  view: ViewDefinition
  instanceId: string
  context?: unknown
}

export type WorkbenchSurfaceDescriptor =
  | WorkbenchNativeVueSurfaceDescriptor
  | WorkbenchWebviewSurfaceDescriptor
  | WorkbenchIsolatedSurfaceDescriptor

export interface WorkbenchSurfaceRendererContext extends WorkbenchTabContext {
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}

export type WorkbenchSurfaceResolver = (
  context: WorkbenchSurfaceRendererContext,
) => MaybePromise<WorkbenchSurfaceDescriptor>

export interface WorkbenchSurfaceRendererContribution {
  id: string
  title: string
  ownerExtensionId?: string
  order?: number
  tabKind: string
  surface?: WorkbenchSurfaceDescriptor | WorkbenchSurfaceResolver
  component?: WorkbenchComponent
}

import type { WorkbenchRuntimeApi } from '../runtime/types'
import type { MaybePromise } from '../shared/types'
import type { WorkbenchTab, WorkbenchTabContext } from './contributions'
import type { WorkbenchComponent } from './ui'

export type WorkbenchSurfaceMode =
  | 'native-vue'
  | 'shadow-dom'
  | 'iframe'
  | 'external-url'
  | 'webview'

export type WorkbenchSurfacePermission = string

export interface WorkbenchSurfaceSandboxOptions {
  allowDownloads?: boolean
  allowForms?: boolean
  allowModals?: boolean
  allowPopups?: boolean
  allowPopupsToEscapeSandbox?: boolean
  allowPresentation?: boolean
  allowSameOrigin?: boolean
  allowScripts?: boolean
  allowTopNavigationByUserActivation?: boolean
  extraTokens?: string[]
}

export interface WorkbenchSurfaceBridgeOptions {
  enabled?: boolean
  allowExternalUrl?: boolean
  allowedOrigins?: string[]
  allowedCapabilities?: string[]
  targetOrigin?: string
}

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

export interface WorkbenchSurfaceStyleUrl {
  href: string
  crossOrigin?: 'anonymous' | 'use-credentials'
  integrity?: string
}

export interface WorkbenchSurfaceDescriptorBase {
  id: string
  ownerExtensionId?: string
  title?: string
  component?: WorkbenchComponent
  props?: Record<string, unknown>
  passThrough?: Record<string, unknown>
  url?: string
  entry?: string
  html?: string
  srcdoc?: string
  styles?: string[]
  styleUrls?: Array<string | WorkbenchSurfaceStyleUrl>
  sandbox?: WorkbenchSurfaceSandboxOptions
  permissions?: WorkbenchSurfacePermission[]
  capabilities?: string[]
  bridge?: WorkbenchSurfaceBridgeOptions
  metadata?: Record<string, unknown>
  fallback?: WorkbenchSurfaceFallback
}

export interface WorkbenchNativeVueSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'native-vue'
}

export interface WorkbenchShadowDomSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'shadow-dom'
}

export interface WorkbenchIframeSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'iframe'
}

export interface WorkbenchExternalUrlSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'external-url'
  url: string
}

export interface WorkbenchWebviewSurfaceDescriptor extends WorkbenchSurfaceDescriptorBase {
  mode: 'webview'
}

export type WorkbenchSurfaceDescriptor =
  | WorkbenchNativeVueSurfaceDescriptor
  | WorkbenchShadowDomSurfaceDescriptor
  | WorkbenchIframeSurfaceDescriptor
  | WorkbenchExternalUrlSurfaceDescriptor
  | WorkbenchWebviewSurfaceDescriptor

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

export type WorkbenchTabSurfaceContribution = WorkbenchSurfaceDescriptor & {
  title: string
  tabKind?: string
  order?: number
}

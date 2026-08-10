export const SURFACE_MESSAGE_TYPES = {
  ready: 'activelane.surface.ready',
  error: 'activelane.surface.error',
  request: 'activelane.surface.request',
  response: 'activelane.surface.response',
  event: 'activelane.surface.event',
} as const

export interface SurfaceMessageEnvelope<TPayload = unknown> {
  type: (typeof SURFACE_MESSAGE_TYPES)[keyof typeof SURFACE_MESSAGE_TYPES]
  surfaceId: string
  extensionId?: string
  correlationId?: string
  payload?: TPayload
}

export interface SurfaceCapabilityRequestPayload {
  capability: string
  input?: unknown
}

export interface SurfaceResponsePayload {
  ok: boolean
  result?: unknown
  error?: string
}

export const VIEW_PROTOCOL = 'activelane.view/1' as const

export interface ViewIdentity {
  extensionId: string
  definitionId: string
  instanceId: string
}

export interface ViewConnectMessage {
  protocol: typeof VIEW_PROTOCOL
  type: 'connect'
  identity: ViewIdentity
}

export interface ViewRequest {
  protocol: typeof VIEW_PROTOCOL
  type: 'request'
  id: string
  method: string
  params?: unknown
}

export interface ViewResponse {
  protocol: typeof VIEW_PROTOCOL
  type: 'response'
  id: string
  result?: unknown
  error?: { code: string; message: string }
}

export interface ViewEvent {
  protocol: typeof VIEW_PROTOCOL
  type: 'event'
  event: string
  value?: unknown
}

export type ViewPortMessage = ViewRequest | ViewResponse | ViewEvent

export function isViewConnectMessage(value: unknown): value is ViewConnectMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<ViewConnectMessage>
  const identity = message.identity as Partial<ViewIdentity> | undefined
  return (
    message.protocol === VIEW_PROTOCOL &&
    message.type === 'connect' &&
    typeof identity?.extensionId === 'string' &&
    typeof identity.definitionId === 'string' &&
    typeof identity.instanceId === 'string'
  )
}

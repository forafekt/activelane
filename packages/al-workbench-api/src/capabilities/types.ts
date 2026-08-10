import type { Disposable, MaybePromise } from '../shared/types'

export interface CapabilityInvocationRecord {
  id: string
  capabilityId: string
  extensionId?: string
  inputJson?: string
  outputJson?: string
  succeeded: boolean
  invokedAt: string
}

export interface ExtensionEventRecord {
  id: string
  extensionId?: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

export type ActiveLaneCapabilityRisk = 'low' | 'moderate' | 'high' | 'critical'

export type ActiveLaneCapabilityKind =
  | 'command'
  | 'tool'
  | 'resource'
  | 'job'
  | 'api'
  | 'workflow'
  | 'publisher'
  | 'storage'
  | 'sync'
  | 'infra'
  | 'mcp.tool'
  | 'mcp.resource'
  | 'mcp.prompt'
  | 'ai.tool'

export interface ActiveLaneCapability {
  id: string
  kind: ActiveLaneCapabilityKind
  title: string
  description?: string
  extensionId?: string
  providerId?: string
  inputSchema?: unknown
  outputSchema?: unknown
  permissions?: string[]
  risk?: ActiveLaneCapabilityRisk
  tags?: string[]
  transport?: 'direct' | 'mcp' | 'http' | 'job' | 'workflow'
  availability?: 'local' | 'server' | 'remote'
  metadata?: Record<string, unknown>
}

export interface ActiveLaneCapabilityInvocation {
  capability: ActiveLaneCapability
  input: unknown
  callerExtensionId?: string
}

export type ActiveLaneCapabilityHandler<TResult = unknown, TInput = unknown> = (
  invocation: ActiveLaneCapabilityInvocation & { input: TInput },
) => MaybePromise<TResult>

export interface ActiveLaneCapabilityRecord extends ActiveLaneCapability {
  source: 'manifest' | 'extension' | 'server-extension' | 'adapter' | 'runtime'
}

export interface ActiveLaneCapabilityService {
  entries: ActiveLaneCapabilityRecord[]
  list: (
    filter?: Partial<Pick<ActiveLaneCapability, 'kind' | 'extensionId' | 'providerId'>>,
  ) => ActiveLaneCapabilityRecord[]
  get: (capabilityId: string) => ActiveLaneCapabilityRecord | undefined
  register: <TInput = unknown, TResult = unknown>(
    capability: ActiveLaneCapability,
    handler?: ActiveLaneCapabilityHandler<TResult, TInput>,
    options?: { source?: ActiveLaneCapabilityRecord['source'] },
  ) => Disposable
  invoke: <TResult = unknown, TInput = unknown>(
    capabilityId: string,
    input?: TInput,
    callerExtensionId?: string,
  ) => Promise<TResult>
}

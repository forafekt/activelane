export const API_STUDIO_ENTITLEMENTS = {
  unlimitedHistory: 'api-studio.history.unlimited',
  unlimitedEnvironments: 'api-studio.environments.unlimited',
  advancedInspector: 'api-studio.inspector.advanced',
  transfer: 'api-studio.transfer',
} as const

export interface ApiRequest {
  id: string
  collectionId: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
  url: string
  query: Array<{ key: string; value: string; enabled: boolean }>
  headers: Array<{ key: string; value: string; enabled: boolean }>
  body: { type: 'none' | 'json' | 'text'; value: string }
}

export interface ApiCollection {
  id: string
  name: string
  requests: ApiRequest[]
}
export interface ApiEnvironment {
  id: string
  name: string
  variables: Record<string, string>
}
export interface RequestHistoryEntry {
  id: string
  requestId: string
  requestName: string
  method: ApiRequest['method']
  url: string
  timestamp: string
  responseStatus?: number
  durationMs: number
}

export interface ApiStudioState {
  collections: ApiCollection[]
  environments: ApiEnvironment[]
  activeEnvironmentId?: string
  history: RequestHistoryEntry[]
}

export function resolveVariables(value: string, environment?: ApiEnvironment) {
  return value.replace(/\{\{([a-zA-Z][\w.-]*)\}\}/g, (source, key: string) =>
    Object.hasOwn(environment?.variables ?? {}, key) ? (environment?.variables[key] ?? '') : source,
  )
}

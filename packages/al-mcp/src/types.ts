export type McpJson = unknown

export type McpCapabilityKind = 'tool' | 'resource' | 'action'

export interface McpCapability {
  id: string
  kind: McpCapabilityKind
  title: string
  description?: string
  inputSchema?: McpJson
  outputSchema?: McpJson
  permissions?: string[]
  ownerExtensionId?: string
}

export interface McpToolCapability extends McpCapability {
  kind: 'tool'
}

export interface McpResourceCapability extends McpCapability {
  kind: 'resource'
  uriTemplate?: string
  mimeType?: string
}

export interface McpActionCapability extends McpCapability {
  kind: 'action'
}

export type McpRegisteredCapability =
  | McpToolCapability
  | McpResourceCapability
  | McpActionCapability

export interface McpEndpointDescriptor {
  id: string
  ownerExtensionId: string
  label?: string
  local: boolean
  remoteUrl?: string
  capabilities: McpRegisteredCapability[]
}

export interface McpRequest<TParams = McpJson> {
  jsonrpc: '2.0'
  id: string
  method: string
  params?: TParams
}

export interface McpSuccess<TResult = McpJson> {
  jsonrpc: '2.0'
  id: string
  result: TResult
}

export interface McpFailure {
  jsonrpc: '2.0'
  id: string
  error: {
    code: number
    message: string
    data?: McpJson
  }
}

export type McpResponse<TResult = McpJson> = McpSuccess<TResult> | McpFailure

export interface McpTransport {
  request: <TResult = McpJson, TParams = McpJson>(
    request: McpRequest<TParams>,
  ) => Promise<McpResponse<TResult>>
}

export type McpHandler<TParams = McpJson, TResult = McpJson> = (
  params: TParams | undefined,
  request: McpRequest<TParams>,
) => Promise<TResult> | TResult

export interface McpToolCallParams {
  name: string
  arguments?: McpJson
}

export interface McpResourceReadParams {
  uri: string
}

export interface McpActionInvokeParams {
  id: string
  input?: McpJson
}

export interface McpCapabilityRegistry {
  list: (filter?: {
    kind?: McpCapabilityKind
    ownerExtensionId?: string
  }) => McpRegisteredCapability[]
  get: (id: string) => McpRegisteredCapability | undefined
  register: (capability: McpRegisteredCapability) => { dispose: () => void }
}

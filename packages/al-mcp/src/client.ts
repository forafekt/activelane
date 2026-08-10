import { McpError } from './errors'
import type {
  McpActionInvokeParams,
  McpCapabilityKind,
  McpJson,
  McpRegisteredCapability,
  McpRequest,
  McpTransport,
} from './types'

export class McpClient {
  private sequence = 0

  constructor(
    readonly endpointId: string,
    private readonly transport: McpTransport,
  ) {}

  async request<TResult = McpJson, TParams = McpJson>(method: string, params?: TParams) {
    const request: McpRequest<TParams> = {
      jsonrpc: '2.0',
      id: `${this.endpointId}:${++this.sequence}`,
      method,
      params,
    }
    const response = await this.transport.request<TResult, TParams>(request)
    if ('error' in response) {
      throw new McpError(response.error.message, response.error.code, response.error.data)
    }
    return response.result
  }

  listCapabilities(filter?: { kind?: McpCapabilityKind; ownerExtensionId?: string }) {
    return this.request<McpRegisteredCapability[], typeof filter>('mcp.capabilities/list', filter)
  }

  callTool<TResult = McpJson>(name: string, args?: McpJson) {
    return this.request<TResult>('tools/call', { name, arguments: args })
  }

  readResource<TResult = McpJson>(uri: string) {
    return this.request<TResult>('resources/read', { uri })
  }

  invokeAction<TResult = McpJson>(id: string, input?: McpJson) {
    const params: McpActionInvokeParams = { id, input }
    return this.request<TResult>('actions/invoke', params)
  }
}

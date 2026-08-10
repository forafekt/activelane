import { McpError, toMcpFailure } from './errors'
import type {
  McpActionInvokeParams,
  McpCapabilityKind,
  McpHandler,
  McpRegisteredCapability,
  McpRequest,
  McpResourceReadParams,
  McpResponse,
  McpToolCallParams,
} from './types'

interface RegisteredHandler {
  capability: McpRegisteredCapability
  handler: McpHandler
}

export class McpServer {
  private readonly handlers = new Map<string, McpHandler>()
  private readonly capabilities = new Map<string, RegisteredHandler>()

  constructor(readonly id: string) {
    this.registerMethod('mcp.capabilities/list', (params) => {
      const filter = params as { kind?: McpCapabilityKind; ownerExtensionId?: string } | undefined
      return this.listCapabilities(filter)
    })
    this.registerMethod('tools/call', (params) => {
      const input = params as McpToolCallParams
      return this.invokeCapability(input.name, 'tool', input.arguments)
    })
    this.registerMethod('resources/read', (params) => {
      const input = params as McpResourceReadParams
      return this.invokeCapability(input.uri, 'resource', input)
    })
    this.registerMethod('actions/invoke', (params) => {
      const input = params as McpActionInvokeParams
      return this.invokeCapability(input.id, 'action', input.input)
    })
  }

  registerMethod(method: string, handler: McpHandler) {
    this.handlers.set(method, handler)
    return {
      dispose: () => {
        this.handlers.delete(method)
      },
    }
  }

  registerCapability<TParams = unknown, TResult = unknown>(
    capability: McpRegisteredCapability,
    handler: McpHandler<TParams, TResult>,
  ) {
    this.capabilities.set(capability.id, {
      capability,
      handler: handler as McpHandler,
    })
    return {
      dispose: () => {
        this.capabilities.delete(capability.id)
      },
    }
  }

  listCapabilities(filter?: { kind?: McpCapabilityKind; ownerExtensionId?: string }) {
    return [...this.capabilities.values()]
      .map((entry) => entry.capability)
      .filter((capability) => !filter?.kind || capability.kind === filter.kind)
      .filter(
        (capability) =>
          !filter?.ownerExtensionId || capability.ownerExtensionId === filter.ownerExtensionId,
      )
  }

  async handleRequest<TResult = unknown, TParams = unknown>(
    request: McpRequest<TParams>,
  ): Promise<McpResponse<TResult>> {
    try {
      const handler = this.handlers.get(request.method)
      if (!handler) throw new McpError(`Unknown MCP method: ${request.method}`, -32601)
      const result = await handler(request.params as never, request as never)
      return { jsonrpc: '2.0', id: request.id, result: result as TResult }
    } catch (error) {
      return toMcpFailure(request.id, error) as McpResponse<TResult>
    }
  }

  private invokeCapability(id: string, kind: McpCapabilityKind, input: unknown) {
    const entry = this.capabilities.get(id)
    if (!entry || entry.capability.kind !== kind) {
      throw new McpError(`Unknown MCP ${kind}: ${id}`, -32602)
    }
    return entry.handler(input as never, {
      jsonrpc: '2.0',
      id: `${kind}:${id}`,
      method: `${kind}/invoke`,
      params: input as never,
    })
  }
}

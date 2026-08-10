import { createInMemoryMcpTransport } from './transport'
import type {
  McpCapabilityKind,
  McpEndpointDescriptor,
  McpRegisteredCapability,
  McpRequest,
  McpResponse,
} from './types'

export interface McpEndpoint {
  descriptor: McpEndpointDescriptor
  handleRequest: <TResult = unknown, TParams = unknown>(
    request: McpRequest<TParams>,
  ) => Promise<McpResponse<TResult>>
}

export class LocalMcpRouter {
  private readonly endpoints = new Map<string, McpEndpoint>()

  registerEndpoint(endpoint: McpEndpoint) {
    this.endpoints.set(endpoint.descriptor.id, endpoint)
    return {
      dispose: () => {
        this.endpoints.delete(endpoint.descriptor.id)
      },
    }
  }

  listEndpoints() {
    return [...this.endpoints.values()].map((endpoint) => endpoint.descriptor)
  }

  getEndpoint(endpointId: string) {
    return this.endpoints.get(endpointId)
  }

  createTransport(endpointId: string) {
    const endpoint = this.endpoints.get(endpointId)
    if (!endpoint) throw new Error(`Unknown MCP endpoint: ${endpointId}`)
    return createInMemoryMcpTransport(endpoint)
  }

  discover(filter?: { kind?: McpCapabilityKind; ownerExtensionId?: string }) {
    const capabilities: Array<McpRegisteredCapability & { endpointId: string }> = []
    for (const endpoint of this.endpoints.values()) {
      for (const capability of endpoint.descriptor.capabilities) {
        if (filter?.kind && capability.kind !== filter.kind) continue
        if (filter?.ownerExtensionId && capability.ownerExtensionId !== filter.ownerExtensionId)
          continue
        capabilities.push({ ...capability, endpointId: endpoint.descriptor.id })
      }
    }
    return capabilities
  }
}

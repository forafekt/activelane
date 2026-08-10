import type { McpRequest, McpResponse, McpTransport } from './types'

export interface McpRequestSink {
  handleRequest: <TResult = unknown, TParams = unknown>(
    request: McpRequest<TParams>,
  ) => Promise<McpResponse<TResult>>
}

export function createInMemoryMcpTransport(sink: McpRequestSink): McpTransport {
  return {
    request(request) {
      return sink.handleRequest(request)
    },
  }
}

export function createInMemoryMcpTransportPair(left: McpRequestSink, right: McpRequestSink) {
  return {
    left: createInMemoryMcpTransport(right),
    right: createInMemoryMcpTransport(left),
  }
}

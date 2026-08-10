export class McpError extends Error {
  constructor(
    message: string,
    readonly code = -32000,
    readonly data?: unknown,
  ) {
    super(message)
    this.name = 'McpError'
  }
}

export function toMcpFailure(id: string, error: unknown) {
  if (error instanceof McpError) {
    return {
      jsonrpc: '2.0' as const,
      id,
      error: {
        code: error.code,
        message: error.message,
        data: error.data as never,
      },
    }
  }
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code: -32000,
      message: error instanceof Error ? error.message : String(error),
    },
  }
}

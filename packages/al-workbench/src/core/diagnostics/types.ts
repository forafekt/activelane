export type ExtensionDiagnosticSeverity = 'info' | 'warning' | 'error'

export type ExtensionDiagnosticSource =
  | 'manifest'
  | 'development'
  | 'runtime'
  | 'contribution'
  | 'view'
  | 'asset'
  | 'bridge'
  | 'command'
  | 'service'
  | 'permission'
  | 'lifecycle'

export type ExtensionDiagnosticCode =
  | 'EXT_MANIFEST_INVALID'
  | 'EXT_DEV_REGISTRATION_FAILED'
  | 'EXT_RUNTIME_BUILD_FAILED'
  | 'EXT_RUNTIME_ACTIVATION_FAILED'
  | 'EXT_RUNTIME_DEACTIVATION_FAILED'
  | 'VIEW_ASSET_RESOLUTION_FAILED'
  | 'VIEW_DOCUMENT_LOAD_FAILED'
  | 'VIEW_BRIDGE_TIMEOUT'
  | 'VIEW_BRIDGE_IDENTITY_MISMATCH'
  | 'EXT_COMMAND_FAILED'
  | 'EXT_SERVICE_FAILED'
  | 'EXT_PERMISSION_DENIED'

export interface ExtensionDiagnostic {
  id: string
  extensionId: string
  generation?: number
  severity: ExtensionDiagnosticSeverity
  source: ExtensionDiagnosticSource
  code: ExtensionDiagnosticCode
  message: string
  detail?: string
  viewDefinitionId?: string
  viewInstanceId?: string
  timestamp: number
  metadata?: Record<string, string | number | boolean | null>
}

export type ExtensionDiagnosticInput = Omit<ExtensionDiagnostic, 'id' | 'timestamp'> & {
  id?: string
  timestamp?: number
}

export interface ExtensionDiagnosticsService {
  readonly active: readonly ExtensionDiagnostic[]
  report(input: ExtensionDiagnosticInput): ExtensionDiagnostic
  clearExtension(extensionId: string, generation?: number): void
  clearView(viewInstanceId: string): void
  clear(id: string): void
}

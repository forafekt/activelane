import type { WorkbenchExtensionDefinition } from './types'

export interface WorkbenchExtensionModuleDescriptor {
  extensionId: string
  version: string
  source: string
  entrypoint: string
}

/** Resolves the one public module contract: a default-exported extension definition. */
export function resolveWorkbenchExtensionModule(
  namespace: unknown,
  descriptor: WorkbenchExtensionModuleDescriptor,
): WorkbenchExtensionDefinition {
  const exports =
    namespace && (typeof namespace === 'object' || typeof namespace === 'function')
      ? (namespace as Record<string, unknown>)
      : undefined
  const definition = exports?.default
  const actualExports = exports
    ? Object.entries(exports)
        .map(([name, value]) => `${name}:${typeof value}`)
        .join(', ')
    : typeof namespace
  const boundary = `${descriptor.extensionId}@${descriptor.version} from ${descriptor.source} (${descriptor.entrypoint})`

  if (!definition || typeof definition !== 'object') {
    throw new Error(
      `Failed to load ${boundary}: expected the ES module default export to be a Workbench extension definition; received exports ${actualExports || 'none'}.`,
    )
  }

  const candidate = definition as Partial<WorkbenchExtensionDefinition>
  if (!candidate.manifest || typeof candidate.manifest !== 'object') {
    throw new Error(`Failed to load ${boundary}: the default export has no extension manifest.`)
  }
  if (candidate.manifest.id !== descriptor.extensionId) {
    throw new Error(
      `Failed to load ${boundary}: default export declares extension ${candidate.manifest.id || '<missing>'}.`,
    )
  }
  if (candidate.manifest.version !== descriptor.version) {
    throw new Error(
      `Failed to load ${boundary}: default export declares version ${candidate.manifest.version || '<missing>'}.`,
    )
  }
  if (candidate.activate !== undefined && typeof candidate.activate !== 'function') {
    throw new Error(`Failed to load ${boundary}: activate must be a function when provided.`)
  }
  if (candidate.deactivate !== undefined && typeof candidate.deactivate !== 'function') {
    throw new Error(`Failed to load ${boundary}: deactivate must be a function when provided.`)
  }

  return candidate as WorkbenchExtensionDefinition
}

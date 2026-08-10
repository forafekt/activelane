import type { ActiveLaneCapability, ActiveLaneCapabilityHandler } from '../capabilities/types'
import type {
  ServerExtensionDefinition,
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
  WorkbenchExtensionManifest,
} from './types'

export function defineExtension<T extends WorkbenchExtensionDefinition>(definition: T): T {
  return definition
}

export function defineWorkbenchExtension<T extends WorkbenchExtensionDefinition>(definition: T): T {
  return defineExtension(definition)
}

export function defineManifest<T extends WorkbenchExtensionManifest>(manifest: T): T {
  return manifest
}

export function defineWorkbenchManifest<T extends WorkbenchExtensionManifest>(manifest: T): T {
  return defineManifest(manifest)
}

export function defineServerExtension<T extends ServerExtensionDefinition>(definition: T): T {
  return definition
}

export function registerCapability<TParams = unknown, TResult = unknown>(
  context: WorkbenchExtensionContext,
  capability: ActiveLaneCapability,
  handler: ActiveLaneCapabilityHandler<TResult, TParams>,
) {
  return context.capabilities.register(
    {
      ...capability,
      extensionId: capability.extensionId ?? context.extensionId,
    },
    handler,
    { source: 'extension' },
  )
}

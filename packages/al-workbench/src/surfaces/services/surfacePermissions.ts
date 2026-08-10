import type { WorkbenchSurfaceDescriptor } from '@activelane/workbench-api'

export function getDeclaredSurfacePermissions(surface: WorkbenchSurfaceDescriptor) {
  return new Set([...(surface.permissions ?? []), ...(surface.capabilities ?? [])])
}

export function canUseSurfaceBridge(surface: WorkbenchSurfaceDescriptor) {
  if (surface.mode === 'external-url' && !surface.bridge?.allowExternalUrl) return false
  return surface.bridge?.enabled === true
}

export function canInvokeSurfaceCapability(
  surface: WorkbenchSurfaceDescriptor,
  capabilityId: string,
) {
  if (!canUseSurfaceBridge(surface)) return false
  const bridgeAllowed = surface.bridge?.allowedCapabilities ?? []
  const declared = getDeclaredSurfacePermissions(surface)
  return bridgeAllowed.includes(capabilityId) && declared.has(capabilityId)
}

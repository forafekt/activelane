import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

export function resolveSurfaceUrl(surface: WorkbenchSurfaceDescriptor) {
  return surface.url ?? surface.entry
}

export function resolveUrlOrigin(url: string | undefined) {
  if (!url || typeof window === 'undefined') return undefined
  try {
    return new URL(url, window.location.href).origin
  } catch {
    return undefined
  }
}

export function isOriginAllowed(
  origin: string,
  surface: WorkbenchSurfaceDescriptor,
  frameUrl?: string,
) {
  if (origin === 'null') return Boolean(surface.html || surface.srcdoc)
  const allowedOrigins = surface.bridge?.allowedOrigins ?? []
  if (allowedOrigins.includes(origin)) return true

  const urlOrigin = resolveUrlOrigin(frameUrl ?? resolveSurfaceUrl(surface))
  return Boolean(urlOrigin && urlOrigin === origin)
}

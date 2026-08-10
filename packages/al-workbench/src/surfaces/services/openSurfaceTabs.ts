import type { Component } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { OpenWorkbenchTabOptions } from '../../core/workbench/contributions'
import type {
  WorkbenchSurfaceDescriptor,
  WorkbenchSurfaceSandboxOptions,
} from '../../core/workbench/surfaces'

type SurfaceTabOptions = Omit<OpenWorkbenchTabOptions, 'kind' | 'title'> &
  Partial<Pick<OpenWorkbenchTabOptions, 'kind' | 'title'>>

function openSurfaceTab(
  runtime: WorkbenchRuntimeApi,
  surface: WorkbenchSurfaceDescriptor,
  options: SurfaceTabOptions = {},
) {
  return runtime.workbench.openTab({
    ...options,
    id: options.id ?? surface.id,
    kind: options.kind ?? surface.id,
    title: options.title ?? surface.title ?? surface.id,
    ownerExtensionId: options.ownerExtensionId ?? surface.ownerExtensionId,
    surfaceId: options.surfaceId ?? surface.id,
    surface,
  })
}

export function openNativeVueSurface(
  runtime: WorkbenchRuntimeApi,
  surface: Omit<WorkbenchSurfaceDescriptor, 'mode' | 'component'> & { component: Component },
  options?: SurfaceTabOptions,
) {
  return openSurfaceTab(runtime, { ...surface, mode: 'native-vue' }, options)
}

export function openIframeSurface(
  runtime: WorkbenchRuntimeApi,
  surface: Omit<WorkbenchSurfaceDescriptor, 'mode'>,
  options?: SurfaceTabOptions,
) {
  return openSurfaceTab(runtime, { ...surface, mode: 'iframe' }, options)
}

export function openExternalUrlSurface(
  runtime: WorkbenchRuntimeApi,
  surface: Omit<WorkbenchSurfaceDescriptor, 'mode' | 'url'> & {
    url: string
    sandbox?: WorkbenchSurfaceSandboxOptions
  },
  options?: SurfaceTabOptions,
) {
  return openSurfaceTab(
    runtime,
    {
      ...surface,
      mode: 'external-url',
      bridge: {
        ...surface.bridge,
        enabled: surface.bridge?.allowExternalUrl === true && surface.bridge.enabled === true,
      },
    },
    options,
  )
}

export function openExtensionSurface(
  runtime: WorkbenchRuntimeApi,
  surfaceId: string,
  options: SurfaceTabOptions = {},
) {
  const surface = runtime.registry.tabSurfaces.find((item) => item.id === surfaceId)
  return runtime.workbench.openTab({
    ...options,
    id: options.id ?? surfaceId,
    kind: options.kind ?? surface?.tabKind ?? surfaceId,
    title: options.title ?? surface?.title ?? surfaceId,
    ownerExtensionId: options.ownerExtensionId ?? surface?.ownerExtensionId,
    surfaceId,
  })
}

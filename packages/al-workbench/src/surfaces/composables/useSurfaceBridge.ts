import { inject, provide } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { WorkbenchSurfaceBridge } from '../bridge/surfaceBridge'

const SURFACE_BRIDGE_SYMBOL = Symbol('ActiveLaneSurfaceBridge')

export function provideSurfaceBridge(runtime: WorkbenchRuntimeApi) {
  const bridge = new WorkbenchSurfaceBridge(runtime)
  provide(SURFACE_BRIDGE_SYMBOL, bridge)
  return bridge
}

export function useSurfaceBridge() {
  const bridge = inject<WorkbenchSurfaceBridge | null>(SURFACE_BRIDGE_SYMBOL, null)
  if (bridge) return bridge
  return null
}

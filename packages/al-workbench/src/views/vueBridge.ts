import { inject, provide } from 'vue'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import { ViewBridge } from './bridge'

const VIEW_BRIDGE = Symbol('ActiveLaneViewBridge')

export function provideViewBridge(runtime: WorkbenchRuntimeApi) {
  const bridge = new ViewBridge(runtime)
  provide(VIEW_BRIDGE, bridge)
  return bridge
}

export function useViewBridge() {
  const bridge = inject<ViewBridge | null>(VIEW_BRIDGE, null)
  if (!bridge) throw new Error('ActiveLane view bridge is unavailable.')
  return bridge
}

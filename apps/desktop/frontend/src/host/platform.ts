import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { createNativeWorkbenchHost } from '@activelane/workbench-api'
import { createExtensionRuntime } from '@activelane/workbench-api/vue'
import { createNativeCapabilities } from '../services/native'
import { createDesktopExtensionCatalog } from './extensions'
import { createDesktopInitialShellState } from './shellState'

export type DesktopPlatformRuntime = WorkbenchRuntimeApi

export async function createDesktopPlatform(): Promise<DesktopPlatformRuntime> {
  const host = createNativeWorkbenchHost({
    id: 'desktop',
    label: 'ActiveLane Desktop',
    storagePrefix: 'activelane.workbench.desktop.v1',
    capabilities: createNativeCapabilities(),
  })

  const runtime = await createExtensionRuntime({
    host,
    extensions: createDesktopExtensionCatalog(),
    initialState: createDesktopInitialShellState(),
    runtimeId: 'activelane.desktop',
  })
  return runtime
}

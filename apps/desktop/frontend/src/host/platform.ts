import {
  createNativeWorkbenchHost,
  createVueExtensionRuntime,
  type WorkbenchRuntimeApi,
} from '@activelane/workbench'
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

  const runtime = await createVueExtensionRuntime({
    host,
    extensions: createDesktopExtensionCatalog(),
    initialState: createDesktopInitialShellState(),
    runtimeId: 'activelane.desktop',
  })
  return runtime
}

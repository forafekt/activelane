import {
  createNativeWorkbenchHost,
  createVueExtensionRuntime,
  type WorkbenchHost,
} from '@activelane/workbench'
import { createDesktopExtensionCatalog } from './extensions'

export const previewWorkbenchHost: WorkbenchHost = { platform: 'web' }

export async function createDesktopPreviewPlatform() {
  const host = createNativeWorkbenchHost({
    id: 'desktop-preview',
    label: 'ActiveLane Desktop Preview',
    storagePrefix: 'activelane.preview.v1',
    capabilities: {
      network: { fetch: (input, init) => fetch(input, init) },
      notify: async (options) => {
        console.info(`[${options.tone ?? 'info'}] ${options.title}`, options.message)
        return undefined
      },
      confirm: async () => true,
      extensions: { listInstalled: async () => [] },
      registry: {
        status: async () => ({ registries: [], mode: 'local-only', publicRegistryEnabled: false }),
        search: async () => ({
          items: [],
          failures: [],
          mode: 'local-only',
          publicRegistryEnabled: false,
        }),
      },
    },
  })
  return createVueExtensionRuntime({
    host,
    extensions: createDesktopExtensionCatalog(),
    runtimeId: 'activelane.desktop.preview',
  })
}

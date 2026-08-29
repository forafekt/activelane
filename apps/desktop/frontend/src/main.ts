import '@activelane/workbench/styles.css'
import { Events } from '@wailsio/runtime'
import { createApp } from 'vue'
import App from './App.vue'
import { createDesktopPreviewPlatform, previewWorkbenchHost } from './host/previewPlatform'

function diagnostics() {
  return (
    globalThis as typeof globalThis & {
      __ACTIVELANE_DIAGNOSTICS__?: {
        mark?: (phase: string, detail?: unknown) => void
        moduleImport?: (specifier: string, phase: string) => void
      }
    }
  ).__ACTIVELANE_DIAGNOSTICS__
}

async function diagnosticImport<T>(specifier: string, load: () => Promise<T>): Promise<T> {
  diagnostics()?.moduleImport?.(specifier, 'before')
  try {
    const module = await load()
    diagnostics()?.moduleImport?.(specifier, 'after')
    return module
  } catch (error) {
    diagnostics()?.moduleImport?.(specifier, 'failed')
    throw error
  }
}

async function start() {
  diagnostics()?.mark?.('start() entered', { href: location.href, protocol: location.protocol })
  const browserPreview =
    location.protocol.startsWith('http') &&
    !Object.keys(window).some((key) => key.toLowerCase().includes('wails'))
  diagnostics()?.mark?.('host mode resolved', { browserPreview })
  const runtime = browserPreview
    ? await createDesktopPreviewPlatform()
    : await (
        await diagnosticImport('./host/platform', () => import('./host/platform'))
      ).createDesktopPlatform()
  diagnostics()?.mark?.('runtime created')
  if (!browserPreview) {
    let synchronization = Promise.resolve()
    Events.On('activelane:development-extensions-changed', () => {
      synchronization = synchronization
        .then(async () => {
          await runtime.extensions.syncInstalled()
        })
        .catch((error) => console.error('Failed to synchronize development extensions:', error))
    })
  }
  const host = browserPreview
    ? previewWorkbenchHost
    : (
        await diagnosticImport('./host/desktopHost', () => import('./host/desktopHost'))
      ).useDesktopHost()
  diagnostics()?.mark?.('host adapter created')
  createApp(App, { runtime, host }).mount('#activelane-workbench')
  diagnostics()?.mark?.('vue mounted')
}

void start().catch((error) => {
  console.error('Failed to start ActiveLane Workbench:', error)
  const host = document.querySelector('#activelane-workbench')
  host?.replaceChildren(
    `ActiveLane Workbench failed to start. ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
  )
})

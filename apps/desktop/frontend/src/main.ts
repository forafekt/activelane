import '@activelane/workbench/styles.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createDesktopPreviewPlatform, previewWorkbenchHost } from './host/previewPlatform'

async function start() {
  const browserPreview = location.protocol.startsWith('http') && !Object.keys(window).some((key) => key.toLowerCase().includes('wails'))
  const runtime = browserPreview
    ? await createDesktopPreviewPlatform()
    : await (await import('./host/platform')).createDesktopPlatform()
  const host = browserPreview
    ? previewWorkbenchHost
    : (await import('./host/desktopHost')).useDesktopHost()
  createApp(App, { runtime, host }).mount('#app')
}

void start().catch((error) => {
  console.error('Failed to start ActiveLane Workbench:', error)
  document.querySelector('#app')?.replaceChildren(`ActiveLane Workbench failed to start. ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
})

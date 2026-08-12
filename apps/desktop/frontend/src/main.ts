import '@activelane/workbench/styles.css'

import { createApp } from 'vue'
import App from './App.vue'
import { useDesktopHost } from './host/desktopHost'
import { createDesktopPlatform } from './host/platform'

async function start() {
  const runtime = await createDesktopPlatform()
  const host = useDesktopHost()
  createApp(App, { runtime, host }).mount('#app')
}

void start().catch((error) => {
  console.error('Failed to start ActiveLane Workbench:', error)
  document.querySelector('#app')?.replaceChildren('ActiveLane Workbench failed to start.')
})

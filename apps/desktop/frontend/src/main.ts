// renderer/main.ts
import '@activelane/workbench/styles.css'
import { provideWorkbenchRuntime, WorkbenchPlugin } from '@activelane/workbench'

import { createApp } from 'vue'
import App from './App.vue'
import { createDesktopPlatform } from './host/platform'

async function start() {
  const runtime = await createDesktopPlatform()
  createApp(App, { runtime, provideWorkbenchRuntime }).use(WorkbenchPlugin).mount('#app')
}

void start().catch((error) => {
  console.error('Failed to start ActiveLane Workbench:', error)
  document.querySelector('#app')?.replaceChildren('ActiveLane Workbench failed to start.')
})

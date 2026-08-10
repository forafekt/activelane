import type { Component, Plugin as VuePlugin } from 'vue'
import './styles/index.css'
import { WorkbenchTitleBar } from './components/platforms'
import { WorkbenchShell } from './components/render/surface'

export { provideWorkbenchRuntime, useWorkbenchRuntime } from './composables/useWorkbenchRuntime'
export { createWorkbenchBuiltinExtensions } from './contributions'
export { createDesktopNativeMenuSnapshot } from './runtime/menus'
export { WorkbenchShell }

const installComponents: [string, Component][] = [
  ['WorkbenchShell', WorkbenchShell],
  ['WorkbenchTitleBar', WorkbenchTitleBar],
]

export const WorkbenchPlugin: VuePlugin = {
  install(app) {
    installComponents.forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}

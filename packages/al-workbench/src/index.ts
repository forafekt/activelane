import type { Component, Plugin as VuePlugin } from 'vue'
import './styles/index.css'
import { WorkbenchTitleBar } from './components/platforms'
import { WorkbenchShell } from './components/render/surface'

export { provideWorkbenchRuntime, useWorkbenchRuntime } from './composables/useWorkbenchRuntime'
export { createWorkbenchBuiltinExtensions } from './contributions'
export type { ActiveLaneCapabilityRecord } from './core/capabilities/types'
export type { InstalledExtensionRecord } from './core/extensions/types'
export type {
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHostCapabilities,
  WorkbenchNotificationOptions,
} from './core/host/types'
export { createNativeWorkbenchHost } from './core/runtime/hosts/native'
export { createWorkbenchRuntimeHttpClient } from './core/runtime/httpClient'
export type { WorkbenchRuntimeApi } from './core/runtime/types'
export type { ServerExtensionHandle } from './core/serverRuntime'
export { createVueExtensionRuntime } from './core/vueRuntime'
export type { WorkbenchTab } from './core/workbench/contributions'
export type { WorkbenchShellState } from './core/workbench/shell'
export {
  createDesktopNativeMenuSnapshot,
  resolveApplicationMenus,
} from './runtime/menus/menuRegistry'
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

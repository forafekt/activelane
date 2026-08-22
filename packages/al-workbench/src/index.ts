import WorkbenchShell from './components/shell/WorkbenchShell.vue'

export { createWorkbenchBuiltinExtensions } from './contributions'
export type { ActiveLaneCapabilityRecord } from './core/capabilities/types'
export type {
  WorkbenchEntitlementResolution,
  WorkbenchEntitlementService,
  WorkbenchSubscription,
  WorkbenchSubscriptionProvider,
} from './core/entitlements/types'
export type {
  ActiveLaneExtensionManifest,
  InstalledExtensionRecord,
  WorkbenchRegistrySearchResponse,
  WorkbenchRegistryStatusResponse,
} from './core/extensions/types'
export type {
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHost,
  WorkbenchHostCapabilities,
  WorkbenchNativePlatform,
  WorkbenchNotificationOptions,
  WorkbenchPlatform,
  WorkbenchWindowHost,
} from './core/host/types'
export type { WorkbenchNativeApplicationMenuSnapshot } from './core/menus/menuContracts'
export { createNativeWorkbenchHost } from './core/runtime/hosts/native'
export { createWorkbenchRuntimeHttpClient } from './core/runtime/httpClient'
export type { WorkbenchRuntimeApi } from './core/runtime/types'
export type { ServerExtensionHandle } from './core/serverRuntime'
export { createVueExtensionRuntime } from './core/vueRuntime'
export type { WorkbenchTab } from './core/workbench/contributions'
export type { WorkbenchShellState } from './core/workbench/shell'
export type {
  WorkbenchBlockId,
  WorkbenchBlockMap,
  WorkbenchComponentId,
  WorkbenchComponentMap,
  WorkbenchUI,
} from './core/workbench/ui'
export {
  createDesktopNativeMenuSnapshot,
  resolveApplicationMenus,
} from './runtime/menus/menuRegistry'
export { WorkbenchShell }

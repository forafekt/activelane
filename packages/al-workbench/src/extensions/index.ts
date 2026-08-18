/** Stable contracts and helpers intended for extension authors. */
export type {
  ActiveLaneCapability,
  ActiveLaneCapabilityHandler,
  ActiveLaneCapabilityInvocation,
  ActiveLaneCapabilityKind,
  ActiveLaneCapabilityRisk,
} from '../core/capabilities/types'
export type {
  WorkbenchEntitlementResolution,
  WorkbenchExtensionEntitlements,
  WorkbenchSubscription,
} from '../core/entitlements/types'
export type { ExplorerNode, ExplorerProvider } from '../core/explorer/types'
export {
  defineExtension,
  defineManifest,
  defineServerExtension,
  defineWorkbenchExtension,
  defineWorkbenchManifest,
  registerCapability,
} from '../core/extensions/helpers'
export {
  resolveWorkbenchExtensionModule,
  type WorkbenchExtensionModuleDescriptor,
} from '../core/extensions/module'
export type {
  ServerExtensionContext,
  ServerExtensionDefinition,
  WorkbenchActivationEvent,
  WorkbenchContributions,
  WorkbenchExtensionCatalogEntry,
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
  WorkbenchExtensionManifest,
  WorkbenchExtensionPermissions,
  WorkbenchExtensionType,
} from '../core/extensions/types'
export type {
  WorkbenchContextExpressionScope,
  WorkbenchContextValue,
} from '../core/menus/context'
export type { Disposable, MaybePromise } from '../core/shared/types'
export type * from '../core/workbench/contributions'
export type {
  FileOpenerContribution,
  FileOpenerResolutionOptions,
  FileOpenIntent,
  ResolvedFileOpener,
} from '../core/workbench/fileOpeners'
export {
  createFileOpenIntent,
  getFileExtension,
  preferenceKeyForFileOpenIntent,
  resolveFileOpeners,
} from '../core/workbench/fileOpeners'
export type * from '../core/workbench/settings'
export type * from '../core/workbench/surfaces'
export type {
  WorkbenchRegisteredTabAction,
  WorkbenchRegisteredTabGroupAction,
  WorkbenchTabActionContext,
  WorkbenchTabGroupActionContext,
  WorkbenchTabHibernationMetadata,
  WorkbenchTabIndicator,
  WorkbenchTabIndicatorSeverity,
} from '../core/workbench/tabWorkspace'
export type * from '../core/workbench/themes'
export type {
  WorkbenchBlockId,
  WorkbenchBlockMap,
  WorkbenchComponent,
  WorkbenchComponentId,
  WorkbenchComponentMap,
  WorkbenchIcon,
  WorkbenchUI,
} from '../core/workbench/ui'

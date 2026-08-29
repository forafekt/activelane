export type MaybePromise<T> = T | Promise<T>

export interface Disposable {
  dispose(): void
}

export type ViewOpenPolicy = 'reveal-or-create' | 'always-new' | 'singleton'

export interface OpenViewOptions<TContext = unknown> {
  title?: string
  context?: TContext
  resource?: string
  policy?: ViewOpenPolicy
  preview?: boolean
  groupId?: string
}

export interface ViewInstance<TContext = unknown> {
  id: string
  definitionId: string
  extensionId: string
  title: string
  resource?: string
  context?: TContext
  dirty: boolean
  createdAt: number
}

export interface ExtensionWorkbenchApi {
  openView<TContext = unknown>(
    definitionId: string,
    options?: OpenViewOptions<TContext>,
  ): ViewInstance<TContext>
  openTab(input: Record<string, unknown>, behavior?: Record<string, unknown>): unknown
  getActiveTab(): { id: string; input?: Record<string, unknown> } | undefined
  setActiveSidebarView(viewId: string): void
  setInspectorCollapsed(collapsed: boolean): void
  setBottomPanelOpen(open: boolean): void
  [member: string]: unknown
}

export interface ExtensionStorage {
  get<T = unknown>(key: string): Promise<T | undefined>
  set<T = unknown>(key: string, value: T): Promise<void>
  delete?(key: string): Promise<void>
}

export interface ExtensionCapability {
  id: string
  title: string
  kind: string
  [field: string]: unknown
}

export interface ExtensionCapabilityService {
  register<TInput = unknown, TResult = unknown>(
    capability: ExtensionCapability,
    handler?: (invocation: { input: TInput; [field: string]: unknown }) => MaybePromise<TResult>,
  ): Disposable
}

export interface ExtensionContributionRegistrar {
  containers(...items: Array<Record<string, unknown>>): Disposable
  views(...items: Array<Record<string, unknown>>): Disposable
  activityRail(...items: Array<Record<string, unknown>>): Disposable
  apps(...items: Array<Record<string, unknown>>): Disposable
  parts(...items: Array<Record<string, unknown>>): Disposable
  statusBar(...items: Array<Record<string, unknown>>): Disposable
  globalMenus(...items: Array<Record<string, unknown>>): Disposable
  sidebarViews(...items: Array<Record<string, unknown>>): Disposable
  commands(...items: Array<Record<string, unknown>>): Disposable
  commandPalette(...items: Array<Record<string, unknown>>): Disposable
  [kind: string]: unknown
}

export interface ExtensionManifest {
  id: string
  name: string
  displayName: string
  version: string
  publisher?: string
  description?: string
  activationEvents?: Array<'onStartup' | 'onCommand' | 'onView' | 'onTab' | 'onDemand'>
  contributes?: Record<string, unknown>
  [field: string]: unknown
}

export interface ExtensionContext {
  extensionId: string
  manifest: ExtensionManifest
  storage: ExtensionStorage
  workbench: ExtensionWorkbenchApi
  capabilities: ExtensionCapabilityService
  contribute: ExtensionContributionRegistrar
  host: {
    capabilities: {
      notify?(input: { title: string; message: string; tone?: string }): MaybePromise<unknown>
      [capability: string]: unknown
    }
    [field: string]: unknown
  }
  commands: { execute(commandId: string): Promise<void> }
  [service: string]: unknown
}

export interface ExtensionDefinition {
  manifest: ExtensionManifest
  activate?(context: ExtensionContext): MaybePromise<undefined | void | Disposable>
  deactivate?(context: ExtensionContext): MaybePromise<void>
}

export function defineExtension<T extends ExtensionDefinition>(definition: T): T {
  return definition
}

export function defineManifest<T extends ExtensionManifest>(manifest: T): T {
  return manifest
}

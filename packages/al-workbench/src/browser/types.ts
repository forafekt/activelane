import type {
  WorkbenchRuntimeApi,
  WorkbenchTab,
  WorkbenchTabInput,
} from '@activelane/workbench-api'

export const WORKBENCH_BROWSER_TAB_KIND = 'browser'

export type BrowserEngineKind = 'iframe' | 'external' | 'webview' | 'remote' | 'preview'

export type BrowserStorageMode = 'global' | 'workspace' | 'ephemeral'

export type BrowserNavigationStatus = 'idle' | 'loading' | 'error' | 'crashed'

export interface BrowserPermissionPolicy {
  allowPopups: boolean
  allowForms: boolean
  allowScripts: boolean
  allowSameOrigin: boolean
  allowDownloads: boolean
  allowExternalNavigation: boolean
}

export interface BrowserTab {
  id: string
  kind: typeof WORKBENCH_BROWSER_TAB_KIND
  url: string
  title: string
  favicon?: string
  status?: BrowserNavigationStatus
  progress?: number
  errorText?: string
  engine: BrowserEngineKind
  storageMode: BrowserStorageMode
  ownerExtensionId?: string
  createdAt: string
  updatedAt: string
}

export interface BrowserTabInput extends BrowserTab, WorkbenchTabInput {
  permissions: BrowserPermissionPolicy
  frameKey: number
}

export interface BrowserAgentTools {
  readPageMetadata: () => Promise<BrowserPageMetadata>
  screenshotPage: () => Promise<BrowserScreenshotResult>
  inspectSelectedElement: () => Promise<BrowserElementInspection | null>
  click: (selector: string) => Promise<void>
  type: (selector: string, text: string) => Promise<void>
  readConsole: () => Promise<BrowserConsoleEntry[]>
}

export interface BrowserPageMetadata {
  url: string
  title?: string
  description?: string
  favicon?: string
}

export interface BrowserScreenshotResult {
  dataUrl?: string
  unsupportedReason?: string
}

export interface BrowserElementInspection {
  selector?: string
  tagName?: string
  text?: string
  attributes?: Record<string, string>
}

export interface BrowserConsoleEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
}

export interface BrowserOpenOptions {
  url?: string
  title?: string
  engine?: BrowserEngineKind
  storageMode?: BrowserStorageMode
  ownerExtensionId?: string
  preview?: boolean
}

export interface BrowserNavigationState {
  url?: string
  title?: string
  favicon?: string
  canGoBack?: boolean
  canGoForward?: boolean
  loading?: boolean
  progress?: number
  errorText?: string | null
  crashed?: boolean
}

export interface BrowserCommandContext {
  runtime: WorkbenchRuntimeApi
  tab?: WorkbenchTab | null
}

export type WorkbenchBrowserTab = WorkbenchTab & {
  kind: typeof WORKBENCH_BROWSER_TAB_KIND
  input: BrowserTabInput
}

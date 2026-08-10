import type {
  BrowserAgentTools,
  BrowserEngineKind,
  BrowserOpenOptions,
  BrowserPermissionPolicy,
  BrowserTabInput,
} from '../types'

export interface BrowserEngineOpenResult {
  handledInternally: boolean
  tabInput?: BrowserTabInput
}

export interface BrowserEngine {
  kind: BrowserEngineKind
  isAvailable: () => boolean
  createDefaultPermissions: () => BrowserPermissionPolicy
  open: (options: BrowserOpenOptions) => BrowserEngineOpenResult | Promise<BrowserEngineOpenResult>
  createAgentTools: (tab: BrowserTabInput) => BrowserAgentTools
}

export function unsupportedBrowserAgentTools(reason: string): BrowserAgentTools {
  return {
    async readPageMetadata() {
      return { url: '', title: reason }
    },
    async screenshotPage() {
      return { unsupportedReason: reason }
    },
    async inspectSelectedElement() {
      return null
    },
    async click() {
      throw new Error(reason)
    },
    async type() {
      throw new Error(reason)
    },
    async readConsole() {
      return []
    },
  }
}

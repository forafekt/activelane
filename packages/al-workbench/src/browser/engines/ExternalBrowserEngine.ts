import type { BrowserOpenOptions, BrowserPermissionPolicy } from '../types'
import type { BrowserEngine, BrowserEngineOpenResult } from './BrowserEngine'
import { unsupportedBrowserAgentTools } from './BrowserEngine'

export class ExternalBrowserEngine implements BrowserEngine {
  readonly kind = 'external'

  isAvailable() {
    return typeof window !== 'undefined'
  }

  createDefaultPermissions(): BrowserPermissionPolicy {
    return {
      allowPopups: false,
      allowForms: false,
      allowScripts: false,
      allowSameOrigin: false,
      allowDownloads: false,
      allowExternalNavigation: true,
    }
  }

  open(options: BrowserOpenOptions): BrowserEngineOpenResult {
    if (!options.url) return { handledInternally: false }
    window.open(options.url, '_blank', 'noopener,noreferrer')
    return { handledInternally: false }
  }

  createAgentTools() {
    return unsupportedBrowserAgentTools('External browser tabs are outside the workbench runtime.')
  }
}

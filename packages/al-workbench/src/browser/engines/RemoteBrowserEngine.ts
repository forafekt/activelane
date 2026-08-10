import type { BrowserOpenOptions, BrowserPermissionPolicy } from '../types'
import type { BrowserEngine, BrowserEngineOpenResult } from './BrowserEngine'
import { unsupportedBrowserAgentTools } from './BrowserEngine'

export class RemoteBrowserEngine implements BrowserEngine {
  readonly kind = 'remote'

  isAvailable() {
    return false
  }

  createDefaultPermissions(): BrowserPermissionPolicy {
    return {
      allowPopups: false,
      allowForms: true,
      allowScripts: true,
      allowSameOrigin: false,
      allowDownloads: false,
      allowExternalNavigation: false,
    }
  }

  open(_options: BrowserOpenOptions): BrowserEngineOpenResult {
    throw new Error('Remote browser engine is reserved for future agent-controlled sessions.')
  }

  createAgentTools() {
    return unsupportedBrowserAgentTools('Remote browser automation is not connected yet.')
  }
}

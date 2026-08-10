import type { BrowserOpenOptions, BrowserPermissionPolicy, BrowserTabInput } from '../types'
import { WORKBENCH_BROWSER_TAB_KIND } from '../types'
import { titleFromUrl } from '../utils/url'
import type { BrowserEngine, BrowserEngineOpenResult } from './BrowserEngine'
import { unsupportedBrowserAgentTools } from './BrowserEngine'

export class WebviewBrowserEngine implements BrowserEngine {
  readonly kind = 'webview'

  isAvailable() {
    return false
  }

  createDefaultPermissions(): BrowserPermissionPolicy {
    return {
      allowPopups: false,
      allowForms: true,
      allowScripts: true,
      allowSameOrigin: true,
      allowDownloads: false,
      allowExternalNavigation: false,
    }
  }

  open(options: BrowserOpenOptions): BrowserEngineOpenResult {
    if (!options.url) return { handledInternally: false }
    const now = new Date().toISOString()
    const input: BrowserTabInput = {
      id: `browser:${createBrowserId()}`,
      kind: WORKBENCH_BROWSER_TAB_KIND,
      url: options.url,
      title: options.title ?? titleFromUrl(options.url),
      engine: 'webview',
      storageMode: options.storageMode ?? 'workspace',
      ownerExtensionId: options.ownerExtensionId,
      createdAt: now,
      updatedAt: now,
      status: 'idle',
      progress: 0,
      permissions: this.createDefaultPermissions(),
      frameKey: 0,
    }
    return { handledInternally: true, tabInput: input }
  }

  createAgentTools() {
    return unsupportedBrowserAgentTools('Desktop webview browser tools are not connected yet.')
  }
}

function createBrowserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

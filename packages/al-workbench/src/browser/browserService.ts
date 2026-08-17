import { getIcon } from '@activelane/icons'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import type { BrowserEngine } from './engines/BrowserEngine'
import { ExternalBrowserEngine } from './engines/ExternalBrowserEngine'
import { IframeBrowserEngine } from './engines/IframeBrowserEngine'
import { RemoteBrowserEngine } from './engines/RemoteBrowserEngine'
import { WebviewBrowserEngine } from './engines/WebviewBrowserEngine'
import type { BrowserEngineKind, BrowserOpenOptions } from './types'
import { WORKBENCH_BROWSER_TAB_KIND } from './types'
import { DEFAULT_BROWSER_HOME_URL, normalizeBrowserUrl } from './utils/url'

const engines = new Map<BrowserEngineKind, BrowserEngine>([
  ['iframe', new IframeBrowserEngine()],
  ['external', new ExternalBrowserEngine()],
  ['webview', new WebviewBrowserEngine()],
  ['remote', new RemoteBrowserEngine()],
])

export function getBrowserEngine(kind: BrowserEngineKind) {
  return engines.get(kind) ?? engines.get('iframe')
}

export function resolveBrowserEngine(runtime: WorkbenchRuntimeApi, requested?: BrowserEngineKind) {
  const configured =
    requested ??
    runtime.settings.get<BrowserEngineKind>('workbench.browser.defaultEngine', 'iframe')
  if (runtime.host.kind === 'desktop' && configured === 'webview') {
    return getAvailableEngine('webview') ?? getAvailableEngine('iframe')
  }
  if (runtime.host.kind === 'browser-extension' && configured === 'preview') {
    return getAvailableEngine('preview') ?? getAvailableEngine('iframe')
  }
  return (
    getAvailableEngine(configured) ?? getAvailableEngine('iframe') ?? getAvailableEngine('external')
  )
}

export function openWorkbenchBrowser(runtime: WorkbenchRuntimeApi, options: BrowserOpenOptions) {
  const url =
    options.url ??
    runtime.settings.get<string>('workbench.browser.homeUrl', DEFAULT_BROWSER_HOME_URL) ??
    DEFAULT_BROWSER_HOME_URL
  const normalized = normalizeBrowserUrl(url)
  if (!normalized.ok || !normalized.url) {
    void runtime.host.capabilities.notify?.({
      title: 'Browser URL blocked',
      message: normalized.reason,
      tone: 'warning',
    })
    return null
  }
  const engine = resolveBrowserEngine(runtime, options.engine)
  if (!engine) return null
  const result = engine.open({
    ...options,
    url: normalized.url,
    storageMode:
      options.storageMode ??
      runtime.settings.get('workbench.browser.defaultStorageMode', 'workspace'),
  })
  if (result instanceof Promise) {
    void result.then((resolved) => openResolvedBrowserTab(runtime, resolved, options.preview))
    return null
  }
  return openResolvedBrowserTab(runtime, result, options.preview)
}

function openResolvedBrowserTab(
  runtime: WorkbenchRuntimeApi,
  result: Awaited<ReturnType<BrowserEngine['open']>>,
  preview?: boolean,
) {
  if (!result.handledInternally || !result.tabInput) return null
  return runtime.workbench.openTab(
    {
      id: result.tabInput.id,
      kind: WORKBENCH_BROWSER_TAB_KIND,
      title: result.tabInput.title,
      icon: getIcon('lucide.globe'),
      input: result.tabInput,
      ownerExtensionId: result.tabInput.ownerExtensionId ?? 'activelane.workbench-browser',
      preview: preview ?? true,
      capabilities: ['browser'],
    },
    { source: 'command', mode: preview === false ? 'persistent' : 'preview' },
  )
}

function getAvailableEngine(kind: BrowserEngineKind) {
  const engine = engines.get(kind)
  return engine?.isAvailable() ? engine : null
}

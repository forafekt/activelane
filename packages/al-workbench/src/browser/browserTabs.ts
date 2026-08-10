import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench-api'
import {
  type BrowserNavigationState,
  type BrowserTabInput,
  WORKBENCH_BROWSER_TAB_KIND,
  type WorkbenchBrowserTab,
} from './types'

export function isBrowserTab(tab: WorkbenchTab | null | undefined): tab is WorkbenchBrowserTab {
  return tab?.kind === WORKBENCH_BROWSER_TAB_KIND && Boolean(tab.input)
}

export function getActiveBrowserTab(runtime: WorkbenchRuntimeApi): WorkbenchBrowserTab | null {
  const tab = runtime.workbench.getActiveTab()
  return isBrowserTab(tab) ? tab : null
}

export function updateBrowserTabInput(
  runtime: WorkbenchRuntimeApi,
  tab: WorkbenchBrowserTab,
  update: (input: BrowserTabInput) => BrowserTabInput,
) {
  const input = update(tab.input)
  if (input === tab.input || browserTabInputEquivalent(tab.input, input)) return
  runtime.workbench.openTab(
    {
      id: tab.id,
      kind: WORKBENCH_BROWSER_TAB_KIND,
      title: input.title,
      icon: tab.icon,
      input,
      ownerExtensionId: tab.ownerExtensionId,
      preview: tab.preview,
      pinned: tab.pinned,
      dirty: tab.dirty,
      capabilities: tab.capabilities,
    },
    { activate: true, replacePreview: false, mode: tab.preview ? 'preview' : 'persistent' },
  )
}

export function updateActiveBrowserTabInput(
  runtime: WorkbenchRuntimeApi,
  update: (input: BrowserTabInput) => BrowserTabInput,
) {
  const tab = getActiveBrowserTab(runtime)
  if (!tab) return
  updateBrowserTabInput(runtime, tab, update)
}

export function publishBrowserNavigationState(tabId: string, detail: BrowserNavigationState) {
  window.dispatchEvent(new CustomEvent(`workbench-browser-navigation:${tabId}`, { detail }))
}

export function postBrowserCommand(tabId: string, message: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(`workbench-browser:${tabId}`, { detail: message }))
}

function browserTabInputEquivalent(left: BrowserTabInput, right: BrowserTabInput) {
  return (
    left.id === right.id &&
    left.kind === right.kind &&
    left.url === right.url &&
    left.title === right.title &&
    left.favicon === right.favicon &&
    left.status === right.status &&
    left.progress === right.progress &&
    left.errorText === right.errorText &&
    left.engine === right.engine &&
    left.storageMode === right.storageMode &&
    left.ownerExtensionId === right.ownerExtensionId &&
    left.createdAt === right.createdAt &&
    left.frameKey === right.frameKey &&
    left.permissions === right.permissions
  )
}

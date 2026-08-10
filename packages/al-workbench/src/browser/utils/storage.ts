import type { BrowserStorageMode } from '../types'

export function browserStorageNamespace(mode: BrowserStorageMode, ownerExtensionId?: string) {
  if (mode === 'ephemeral') return null
  const owner = ownerExtensionId ? `extension:${ownerExtensionId}` : 'workbench'
  return mode === 'workspace'
    ? `workbench.browser.workspace.${owner}`
    : `workbench.browser.global.${owner}`
}

export function nextBrowserFrameKey(current: number | undefined) {
  return (current ?? 0) + 1
}

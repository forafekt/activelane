import { getIcon } from '@activelane/icons'
import type { MaybePromise } from '../core/shared/types'
import type {
  WorkbenchCommandContribution,
  WorkbenchCommandExecutionContext,
} from '../core/workbench/contributions'

import { openWorkbenchBrowser } from './browserService'
import { getActiveBrowserTab, postBrowserCommand, updateActiveBrowserTabInput } from './browserTabs'
import { nextBrowserFrameKey } from './utils/storage'
import {
  DEFAULT_BROWSER_HOME_URL,
  DEFAULT_SEARCH_PROVIDER_URL,
  normalizeBrowserAddress,
} from './utils/url'

function command(
  id: string,
  title: string,
  run: (context: WorkbenchCommandExecutionContext) => MaybePromise<void>,
  icon = getIcon('globe'),
  shortcut?: string,
): WorkbenchCommandContribution {
  return { id, title, category: 'Browser', icon, run, shortcut }
}

function notifyUrlInputMoved(context: WorkbenchCommandExecutionContext, title: string) {
  void context.runtime.host.capabilities.notify?.({
    title,
    message: 'Use the browser address bar to enter a custom URL.',
    tone: 'info',
  })
}

export function createBrowserCommands(): WorkbenchCommandContribution[] {
  return [
    command(
      'workbench.browser.newTab',
      'Browser: New Tab',
      ({ runtime }) => {
        const homeUrl =
          runtime.settings.get<string>('workbench.browser.homeUrl', DEFAULT_BROWSER_HOME_URL) ??
          DEFAULT_BROWSER_HOME_URL
        openWorkbenchBrowser(runtime, { url: homeUrl, preview: false })
      },
      getIcon('Plus'),
      'Mod+T',
    ),
    command('workbench.browser.openUrl', 'Browser: Open URL', (context) => {
      const homeUrl =
        context.runtime.settings.get<string>(
          'workbench.browser.homeUrl',
          DEFAULT_BROWSER_HOME_URL,
        ) ?? DEFAULT_BROWSER_HOME_URL
      openWorkbenchBrowser(context.runtime, { url: homeUrl, preview: false })
      notifyUrlInputMoved(context, 'Browser tab opened')
    }),
    command(
      'workbench.browser.home',
      'Browser: Home',
      ({ runtime }) => {
        const homeUrl =
          runtime.settings.get<string>('workbench.browser.homeUrl', DEFAULT_BROWSER_HOME_URL) ??
          DEFAULT_BROWSER_HOME_URL
        navigateBrowserTab(runtime, homeUrl)
      },
      getIcon('House'),
    ),
    command('workbench.browser.openLocalhost', 'Browser: Open Localhost', (context) => {
      const value = 'localhost:5173'
      if (
        context.runtime.settings.get<boolean>('workbench.browser.openLocalhostInBrowser') === false
      ) {
        openWorkbenchBrowser(context.runtime, { url: value, engine: 'external', preview: false })
        notifyUrlInputMoved(context, 'Localhost browser tab opened')
        return
      }
      openWorkbenchBrowser(context.runtime, { url: value, preview: false })
      notifyUrlInputMoved(context, 'Localhost browser tab opened')
    }),
    command(
      'workbench.browser.reload',
      'Browser: Reload',
      ({ runtime }) => {
        updateActiveBrowserTab(runtime, (input) => ({
          ...input,
          updatedAt: new Date().toISOString(),
          status: 'loading',
          frameKey:
            input.engine === 'webview' ? input.frameKey : nextBrowserFrameKey(input.frameKey),
        }))
        postActiveBrowserMessage(runtime, { type: 'workbench-browser:reload' })
      },
      getIcon('RotateCcw'),
      'Mod+R',
    ),
    command(
      'workbench.browser.stop',
      'Browser: Stop Loading',
      ({ runtime }) => {
        postActiveBrowserMessage(runtime, { type: 'workbench-browser:stop' })
      },
      getIcon('X'),
    ),
    command(
      'workbench.browser.back',
      'Browser: Back',
      ({ runtime }) => {
        postActiveBrowserMessage(runtime, { type: 'workbench-browser:back' })
      },
      getIcon('ArrowLeft'),
      'Alt+Left',
    ),
    command(
      'workbench.browser.forward',
      'Browser: Forward',
      ({ runtime }) => {
        postActiveBrowserMessage(runtime, { type: 'workbench-browser:forward' })
      },
      getIcon('ArrowRight'),
      'Alt+Right',
    ),
    command(
      'workbench.browser.openExternal',
      'Browser: Open Externally',
      ({ runtime }) => {
        const tab = getActiveBrowserTab(runtime)
        if (!tab) return
        window.open(tab.input.url, '_blank', 'noopener,noreferrer')
      },
      getIcon('ExternalLink'),
    ),
    command(
      'workbench.browser.duplicate',
      'Browser: Duplicate Tab',
      ({ runtime }) => {
        const tab = getActiveBrowserTab(runtime)
        if (!tab) return
        openWorkbenchBrowser(runtime, {
          url: tab.input.url,
          title: tab.input.title,
          engine: tab.input.engine,
          storageMode: tab.input.storageMode,
          preview: false,
        })
      },
      getIcon('Copy'),
    ),
    command(
      'workbench.browser.clearStorage',
      'Browser: Clear Storage',
      ({ runtime }) => {
        updateActiveBrowserTab(runtime, (input) => ({
          ...input,
          storageMode: 'ephemeral',
          updatedAt: new Date().toISOString(),
          frameKey: nextBrowserFrameKey(input.frameKey),
        }))
        void runtime.host.capabilities.notify?.({
          title: 'Browser storage reset',
          message:
            'The browser tab was reloaded with an ephemeral storage policy. Cross-origin iframe storage remains controlled by the browser.',
          tone: 'info',
        })
      },
      getIcon('Trash2'),
    ),
  ]
}

export function createBrowserCommandPalette() {
  return createBrowserCommands().map((item) => ({
    id: `${item.id}.palette`,
    title: item.title,
    commandId: item.id,
    icon: item.icon,
    category: 'Browser',
    keywords: ['browser', 'preview', 'localhost', 'web'],
  }))
}

export function navigateBrowserTab(
  runtime: WorkbenchCommandExecutionContext['runtime'],
  url: string,
  searchProviderUrl = DEFAULT_SEARCH_PROVIDER_URL,
) {
  const normalized = normalizeBrowserAddress(url, searchProviderUrl)
  if (!normalized.ok || !normalized.url) return normalized
  const nextUrl = normalized.url

  updateActiveBrowserTab(runtime, (input) => ({
    ...input,
    url: nextUrl,
    title: new URL(nextUrl).host,
    status: 'loading',
    errorText: undefined,
    updatedAt: new Date().toISOString(),
    frameKey: input.engine === 'webview' ? input.frameKey : nextBrowserFrameKey(input.frameKey),
  }))
  return normalized
}

function updateActiveBrowserTab(
  runtime: WorkbenchCommandExecutionContext['runtime'],
  update: Parameters<typeof updateActiveBrowserTabInput>[1],
) {
  updateActiveBrowserTabInput(runtime, update)
}

function postActiveBrowserMessage(
  runtime: WorkbenchCommandExecutionContext['runtime'],
  message: Record<string, unknown>,
) {
  const tab = getActiveBrowserTab(runtime)
  if (!tab) return
  postBrowserCommand(tab.id, message)
}

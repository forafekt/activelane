import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import type { ComputedRef } from 'vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { navigateBrowserTab } from '../browserCommands'
import { openWorkbenchBrowser } from '../browserRegistry'
import type { BrowserNavigationState, BrowserTabInput } from '../types'
import { DEFAULT_BROWSER_HOME_URL, DEFAULT_SEARCH_PROVIDER_URL } from '../utils/url'

export function useBrowserNavigation(
  runtime: WorkbenchRuntimeApi,
  tabId: string,
  input: ComputedRef<BrowserTabInput | undefined>,
) {
  const address = ref(input.value?.url ?? '')
  const error = ref<string | null>(null)
  const canGoBack = ref(false)
  const canGoForward = ref(false)
  const loading = ref(false)
  const progress = ref(0)

  const isExternal = computed(() => input.value?.engine === 'external')

  function navigate(value = address.value) {
    const searchProviderUrl =
      runtime.settings.get<string>(
        'workbench.browser.searchProviderUrl',
        DEFAULT_SEARCH_PROVIDER_URL,
      ) ?? DEFAULT_SEARCH_PROVIDER_URL
    const result = navigateBrowserTab(runtime, value, searchProviderUrl)
    if (!result.ok) {
      error.value = result.reason ?? 'The URL is not allowed.'
      return false
    }
    error.value = null
    address.value = result.url ?? value
    return true
  }

  function reload() {
    void runtime.commands.execute('workbench.browser.reload')
  }

  function stop() {
    void runtime.commands.execute('workbench.browser.stop')
  }

  function home() {
    const homeUrl =
      runtime.settings.get<string>('workbench.browser.homeUrl', DEFAULT_BROWSER_HOME_URL) ??
      DEFAULT_BROWSER_HOME_URL
    address.value = homeUrl
    navigate(homeUrl)
  }

  function newTab() {
    const homeUrl =
      runtime.settings.get<string>('workbench.browser.homeUrl', DEFAULT_BROWSER_HOME_URL) ??
      DEFAULT_BROWSER_HOME_URL
    openWorkbenchBrowser(runtime, { url: homeUrl, preview: false })
  }

  function back() {
    void runtime.commands.execute('workbench.browser.back')
  }

  function forward() {
    void runtime.commands.execute('workbench.browser.forward')
  }

  function openExternal() {
    void runtime.commands.execute('workbench.browser.openExternal')
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent).detail as BrowserNavigationState
    if (detail.url) address.value = detail.url
    if (typeof detail.canGoBack === 'boolean') canGoBack.value = detail.canGoBack
    if (typeof detail.canGoForward === 'boolean') canGoForward.value = detail.canGoForward
    if (typeof detail.loading === 'boolean') loading.value = detail.loading
    if (typeof detail.progress === 'number') progress.value = detail.progress
    error.value = detail.errorText ?? null
  }
  window.addEventListener(`workbench-browser-navigation:${tabId}`, listener)
  onBeforeUnmount(() => {
    window.removeEventListener(`workbench-browser-navigation:${tabId}`, listener)
  })

  watch(
    () => input.value?.url,
    (url) => {
      if (url) address.value = url
    },
    { immediate: true },
  )

  return {
    address,
    error,
    canGoBack,
    canGoForward,
    loading,
    progress,
    isExternal,
    navigate,
    reload,
    stop,
    home,
    newTab,
    back,
    forward,
    openExternal,
  }
}

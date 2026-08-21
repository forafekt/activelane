<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { publishBrowserNavigationState } from '../browserTabs'
import type { BrowserNavigationState, BrowserTabInput } from '../types'
import { browserStorageNamespace } from '../utils/storage'
import WorkbenchBrowserErrorState from './WorkbenchBrowserErrorState.vue'

const Loader2 = getIcon('lucide:loader-circle')

defineOptions({ name: 'WorkbenchBrowserWebview' })

const props = defineProps<{
  tabId: string
  input: BrowserTabInput
}>()

const emit = defineEmits<{
  external: []
  navigation: [state: BrowserNavigationState]
}>()

type BrowserWebviewElement = HTMLElement & {
  src: string
  reload: () => void
  stop: () => void
  loadURL?: (url: string) => void
  goBack: () => void
  goForward: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  getURL: () => string
  getTitle: () => string
}

const webview = ref<BrowserWebviewElement | null>(null)
const webviewSrc = ref(props.input.url)
const lastKnownUrl = ref(props.input.url)
const loading = ref(false)
const errorText = ref<string | null>(null)
const crashed = ref(false)

const partition = computed(() => {
  if (props.input.storageMode === 'ephemeral') {
    return `activelane-${props.tabId}-${props.input.frameKey}`
  }
  const namespace = browserStorageNamespace(props.input.storageMode, props.input.ownerExtensionId)
  return `persist:${namespace ?? 'workbench.browser.ephemeral'}`
})

function currentNavigationState(extra: BrowserNavigationState = {}): BrowserNavigationState {
  const view = webview.value
  return {
    url: safeCall(() => view?.getURL()) || lastKnownUrl.value,
    title: safeCall(() => view?.getTitle()) || props.input.title,
    canGoBack: Boolean(safeCall(() => view?.canGoBack())),
    canGoForward: Boolean(safeCall(() => view?.canGoForward())),
    loading: loading.value,
    errorText: errorText.value,
    crashed: crashed.value,
    ...extra,
  }
}

function publish(extra: BrowserNavigationState = {}) {
  const state = currentNavigationState(extra)
  if (state.url) lastKnownUrl.value = state.url
  publishBrowserNavigationState(props.tabId, state)
  emit('navigation', state)
}

function handleStartLoading() {
  loading.value = true
  errorText.value = null
  crashed.value = false
  publish({ loading: true, progress: 0.35 })
}

function handleStopLoading() {
  loading.value = false
  publish({ loading: false, progress: 1 })
}

function handleNavigation() {
  publish()
}

function handleTitle(event: Event) {
  const title = (event as Event & { title?: string }).title
  if (title) publish({ title })
}

function handleFavicon(event: Event) {
  const favicons = (event as Event & { favicons?: string[] }).favicons ?? []
  publish({ favicon: favicons[0] })
}

function handleFailLoad(event: Event) {
  const detail = event as Event & {
    errorCode?: number
    errorDescription?: string
    validatedURL?: string
    isMainFrame?: boolean
  }
  if (detail.isMainFrame === false || detail.errorCode === -3) return
  loading.value = false
  errorText.value = detail.errorDescription || 'Navigation failed.'
  publish({ url: detail.validatedURL, loading: false, errorText: errorText.value, progress: 1 })
}

function handleCrash() {
  loading.value = false
  crashed.value = true
  errorText.value = 'The browser renderer crashed.'
  publish({ loading: false, crashed: true, errorText: errorText.value })
}

function handleNewWindow(event: Event) {
  event.preventDefault()
  const url = (event as Event & { url?: string }).url
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  emit('external')
}

function handleBrowserCommand(event: Event) {
  const type = ((event as CustomEvent).detail as { type?: string }).type
  const view = webview.value
  if (!view) return
  if (type === 'workbench-browser:back' && view.canGoBack()) view.goBack()
  if (type === 'workbench-browser:forward' && view.canGoForward()) view.goForward()
  if (type === 'workbench-browser:reload') view.reload()
  if (type === 'workbench-browser:stop') view.stop()
}

const RenderWebView = defineComponent(() => {
  // create renderable element
  //   <!-- <webview
  //   :key="input.frameKey"
  //   ref="webview"
  //   class="browser-webview__view"
  //   :src="webviewSrc"
  //   :partition="partition"
  //   allowpopups="false"
  //   disablewebsecurity="false"
  //   webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"
  //   @did-start-loading="handleStartLoading"
  //   @did-stop-loading="handleStopLoading"
  //   @did-navigate="handleNavigation"
  //   @did-navigate-in-page="handleNavigation"
  //   @page-title-updated="handleTitle"
  //   @page-favicon-updated="handleFavicon"
  //   @did-fail-load="handleFailLoad"
  //   @render-process-gone="handleCrash"
  //   @crashed="handleCrash"
  //   @new-window="handleNewWindow"
  // /> -->

  return () =>
    h('webview', {
      key: props.input.frameKey,
      ref: webview,
      src: webviewSrc.value,
      class: 'browser-webview__view',
      partition: partition.value,
      allowpopups: false,
      disablewebsecurity: false,
      webpreferences: 'contextIsolation=yes, nodeIntegration=no, sandbox=yes',
      'did-start-loading': handleStartLoading,
      'did-stop-loading': handleStopLoading,
      'did-navigate': handleNavigation,
      'did-navigate-in-page': handleNavigation,
      'page-title-updated': handleTitle,
      'page-favicon-updated': handleFavicon,
      'did-fail-load': handleFailLoad,
      'render-process-gone': handleCrash,
      crashed: handleCrash,
      'new-window': handleNewWindow,
    })
})

watch(
  () => props.input.url,
  (url) => {
    if (!url || url === lastKnownUrl.value) return
    lastKnownUrl.value = url
    errorText.value = null
    crashed.value = false
    const view = webview.value
    if (view?.loadURL) {
      view.loadURL(url)
      return
    }
    webviewSrc.value = url
  },
)

watch(
  () => props.input.frameKey,
  () => {
    lastKnownUrl.value = props.input.url
    webviewSrc.value = props.input.url
    errorText.value = null
    crashed.value = false
  },
)

function safeCall<T>(callback: () => T | undefined) {
  try {
    return callback()
  } catch {
    return undefined
  }
}

window.addEventListener(`workbench-browser:${props.tabId}`, handleBrowserCommand)
onBeforeUnmount(() => {
  window.removeEventListener(`workbench-browser:${props.tabId}`, handleBrowserCommand)
})
</script>

<template>
  <section class="browser-webview">
    <div v-if="loading" class="browser-webview__loading">
      <Loader2 class="size-3.5 animate-spin" />
      Loading {{ input.url }}
    </div>
    <WorkbenchBrowserErrorState
      v-if="crashed"
      :url="input.url"
      title="Browser renderer crashed"
      message="The embedded page stopped unexpectedly. Reload the tab or open it externally."
      @external="emit('external')"
    />
    <WorkbenchBrowserErrorState
      v-else-if="errorText"
      :url="input.url"
      title="Navigation failed"
      :message="errorText"
      @external="emit('external')"
    />
    <!-- <webview
      :key="input.frameKey"
      ref="webview"
      class="browser-webview__view"
      :src="webviewSrc"
      :partition="partition"
      allowpopups="false"
      disablewebsecurity="false"
      webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"
      @did-start-loading="handleStartLoading"
      @did-stop-loading="handleStopLoading"
      @did-navigate="handleNavigation"
      @did-navigate-in-page="handleNavigation"
      @page-title-updated="handleTitle"
      @page-favicon-updated="handleFavicon"
      @did-fail-load="handleFailLoad"
      @render-process-gone="handleCrash"
      @crashed="handleCrash"
      @new-window="handleNewWindow"
    /> -->
    <RenderWebView />
  </section>
</template>

<style scoped>
.browser-webview {
  position: relative;
  height: 100%;
  min-height: 0;
  background: hsl(var(--background));
}

.browser-webview__loading {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--background) / 0.94);
  padding: 0.5rem 0.75rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
}

.browser-webview__view {
  display: flex;
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
}
</style>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { publishBrowserNavigationState } from '../browserTabs'
import type { BrowserNavigationState, BrowserTabInput } from '../types'
import WorkbenchBrowserErrorState from './WorkbenchBrowserErrorState.vue'

const Loader2 = getIcon('Loader2')

defineOptions({ name: 'WorkbenchBrowserFrame' })

const props = defineProps<{
  tabId: string
  input: BrowserTabInput
}>()

const emit = defineEmits<{ external: []; navigation: [state: BrowserNavigationState] }>()

const frame = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const frameHistory = ref<string[]>([props.input.url])
const frameHistoryIndex = ref(0)

const sandbox = computed(() => {
  const permissions = props.input.permissions
  const tokens = ['allow-presentation']
  if (permissions.allowForms) tokens.push('allow-forms')
  if (permissions.allowScripts) tokens.push('allow-scripts')
  if (permissions.allowSameOrigin) tokens.push('allow-same-origin')
  if (permissions.allowPopups) tokens.push('allow-popups')
  if (permissions.allowDownloads) tokens.push('allow-downloads')
  return tokens.join(' ')
})

function publishNavigationState() {
  const state = {
    url: frameHistory.value[frameHistoryIndex.value] ?? props.input.url,
    canGoBack: frameHistoryIndex.value > 0,
    canGoForward: frameHistoryIndex.value < frameHistory.value.length - 1,
    loading: loading.value,
    progress: loading.value ? 0.35 : 1,
    errorText: failed.value ? 'The iframe reported a load failure.' : null,
  }
  publishBrowserNavigationState(props.tabId, state)
  emit('navigation', state)
}

function handleLoad() {
  loading.value = false
  failed.value = false
  try {
    const title = frame.value?.contentDocument?.title
    if (title) emit('navigation', { title, loading: false, progress: 1 })
  } catch {
    // Cross-origin iframes intentionally hide document metadata from the workbench.
  }
  publishNavigationState()
}

function handleError() {
  loading.value = false
  failed.value = true
  publishNavigationState()
}

function navigateHistory(delta: 1 | -1) {
  const nextIndex = frameHistoryIndex.value + delta
  const nextUrl = frameHistory.value[nextIndex]
  if (!nextUrl || !frame.value) return
  frameHistoryIndex.value = nextIndex
  frame.value.src = nextUrl
  publishNavigationState()
}

function handleBrowserCommand(event: Event) {
  const detail = (event as CustomEvent).detail as { type?: string }
  if (detail.type === 'workbench-browser:back') navigateHistory(-1)
  if (detail.type === 'workbench-browser:forward') navigateHistory(1)
  if (detail.type === 'workbench-browser:reload') {
    loading.value = true
    failed.value = false
    if (frame.value) frame.value.src = props.input.url
    publishNavigationState()
  }
  if (detail.type === 'workbench-browser:stop') {
    loading.value = false
    try {
      frame.value?.contentWindow?.stop()
    } catch {
      // Cross-origin frames may reject direct access; the loading indicator still stops.
    }
    publishNavigationState()
  }
}

watch(
  () => props.input.url,
  (url) => {
    loading.value = true
    failed.value = false
    const current = frameHistory.value[frameHistoryIndex.value]
    if (current !== url) {
      frameHistory.value = frameHistory.value.slice(0, frameHistoryIndex.value + 1)
      frameHistory.value.push(url)
      frameHistoryIndex.value = frameHistory.value.length - 1
    }
    publishNavigationState()
  },
  { immediate: true },
)

window.addEventListener(`workbench-browser:${props.tabId}`, handleBrowserCommand)
onBeforeUnmount(() => {
  window.removeEventListener(`workbench-browser:${props.tabId}`, handleBrowserCommand)
})
</script>

<template>
  <section class="browser-frame">
    <div v-if="loading" class="browser-frame__loading">
      <Loader2 class="size-3.5 animate-spin" />
      Loading {{ input.url }}
    </div>
    <WorkbenchBrowserErrorState
      v-if="failed"
      :url="input.url"
      message="The iframe reported a load failure. Some sites also block embedding with CSP or X-Frame-Options, which browsers do not expose as a reliable application-level error."
      @external="emit('external')"
    />
    <!--
      Iframe embedding is intentionally conservative. Many production sites block framing
      with CSP frame-ancestors or X-Frame-Options; browsers enforce those headers before
      ActiveLane can inspect the page, so the fallback is an explicit external-open action.
    -->
    <iframe
      v-show="!failed"
      :key="input.frameKey"
      ref="frame"
      class="browser-frame__iframe"
      :src="input.url"
      :sandbox="sandbox"
      referrerpolicy="strict-origin-when-cross-origin"
      title="Integrated browser"
      :aria-label="input.title"
      @load="handleLoad"
      @error="handleError"
    />
  </section>
</template>

<style scoped>
.browser-frame {
  position: relative;
  height: 100%;
  min-height: 0;
  background: hsl(var(--background));
}

.browser-frame__loading {
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

.browser-frame__iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
}
</style>

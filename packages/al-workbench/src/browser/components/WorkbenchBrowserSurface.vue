<script setup lang="ts">
import { computed, watch } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'

import { updateBrowserTabInput } from '../browserTabs'
import { useBrowserNavigation } from '../composables/useBrowserNavigation'
import type { BrowserNavigationState, BrowserTabInput, WorkbenchBrowserTab } from '../types'
import WorkbenchBrowserErrorState from './WorkbenchBrowserErrorState.vue'
import WorkbenchBrowserFrame from './WorkbenchBrowserFrame.vue'
import WorkbenchBrowserToolbar from './WorkbenchBrowserToolbar.vue'
import WorkbenchBrowserWebview from './WorkbenchBrowserWebview.vue'

defineOptions({ name: 'WorkbenchBrowserSurface' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const browserInput = computed(() => props.tab.input as BrowserTabInput | undefined)
const navigation = useBrowserNavigation(props.runtime, props.tab.id, browserInput)

function openExternal() {
  void props.runtime.commands.execute('workbench.browser.openExternal')
}

function updateNavigationState(state: BrowserNavigationState) {
  const input = browserInput.value
  if (!input) return
  updateBrowserTabInput(props.runtime, props.tab as WorkbenchBrowserTab, (current) => {
    const next = {
      ...current,
      url: state.url ?? current.url,
      title: state.title ?? current.title,
      favicon: state.favicon ?? current.favicon,
      status: state.crashed
        ? 'crashed'
        : state.errorText
          ? 'error'
          : state.loading
            ? 'loading'
            : 'idle',
      progress: state.progress ?? current.progress,
      errorText: state.errorText ?? undefined,
    } satisfies BrowserTabInput

    return hasBrowserInputChanged(current, next)
      ? { ...next, updatedAt: new Date().toISOString() }
      : current
  })
}

function hasBrowserInputChanged(current: BrowserTabInput, next: BrowserTabInput) {
  return (
    current.url !== next.url ||
    current.title !== next.title ||
    current.favicon !== next.favicon ||
    current.status !== next.status ||
    current.progress !== next.progress ||
    current.errorText !== next.errorText
  )
}

watch(
  () => browserInput.value?.url,
  (url) => {
    if (navigation && url) navigation.address.value = url
  },
)
</script>

<template>
  <section class="browser-surface">
    <template v-if="browserInput">
      <WorkbenchBrowserToolbar
        :address="navigation.address.value"
        :can-go-back="navigation.canGoBack.value"
        :can-go-forward="navigation.canGoForward.value"
        :loading="navigation.loading.value"
        :progress="navigation.progress.value"
        :error="navigation.error.value"
        @update:address="navigation.address.value = $event"
        @navigate="navigation.navigate()"
        @back="navigation.back()"
        @forward="navigation.forward()"
        @reload="navigation.reload()"
        @stop="navigation.stop()"
        @home="navigation.home()"
        @new-tab="navigation.newTab()"
        @external="navigation.openExternal()"
        @duplicate="runtime.commands.execute('workbench.browser.duplicate')"
        @clear-storage="runtime.commands.execute('workbench.browser.clearStorage')"
      />
      <WorkbenchBrowserErrorState
        v-if="!['iframe', 'webview'].includes(browserInput.engine)"
        :url="browserInput.url"
        :message="`The ${browserInput.engine} browser engine is registered as a future host seam, but it is not implemented in this host yet.`"
        @external="openExternal"
      />
      <WorkbenchBrowserWebview
        v-else-if="browserInput.engine === 'webview'"
        :tab-id="tab.id"
        :input="browserInput"
        @external="openExternal"
        @navigation="updateNavigationState"
      />
      <WorkbenchBrowserFrame
        v-else
        :tab-id="tab.id"
        :input="browserInput"
        @external="openExternal"
        @navigation="updateNavigationState"
      />
    </template>
    <WorkbenchBrowserErrorState
      v-else
      message="This browser tab is missing its browser input payload."
    />
  </section>
</template>

<style scoped>
.browser-surface {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  background: hsl(var(--background));
}
</style>

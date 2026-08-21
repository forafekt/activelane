<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type {
  WorkbenchSurfaceDescriptor,
  WorkbenchSurfaceLifecycleEvent,
} from '../../core/workbench/surfaces'

import { useSurfaceBridge } from '../composables/useSurfaceBridge'
import { canUseSurfaceBridge } from '../services/surfacePermissions'
import { resolveSurfaceSandbox } from '../utils/sandbox'

const Loader2 = getIcon('lucide:loader-circle')

defineOptions({ name: 'WorkbenchIframeSurface' })

const props = defineProps<{
  tab: WorkbenchTab
  surface: WorkbenchSurfaceDescriptor
}>()

const iframe = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const bridge = useSurfaceBridge()
let bridgeDisposable: { dispose: () => void } | null = null

const frameUrl = computed(() => props.surface.url ?? props.surface.entry)
const srcdoc = computed(() => props.surface.srcdoc ?? props.surface.html)
const sandbox = computed(() => resolveSurfaceSandbox(props.surface.sandbox))
const title = computed(() => props.surface.title ?? props.tab.title)

function handleLifecycle(event: WorkbenchSurfaceLifecycleEvent) {
  if (event.type === 'ready') loading.value = false
  if (event.type === 'error') {
    loading.value = false
    errorMessage.value =
      typeof event.payload === 'string'
        ? event.payload
        : 'The surface reported an error through the bridge.'
  }
}

function registerBridge() {
  bridgeDisposable?.dispose()
  bridgeDisposable = null
  if (!iframe.value || !bridge || !canUseSurfaceBridge(props.surface)) return
  bridgeDisposable = bridge.register({
    surface: props.surface,
    frame: iframe.value,
    onLifecycle: handleLifecycle,
  })
}

function handleLoad() {
  loading.value = false
  registerBridge()
}

watch(
  () => [props.surface.id, frameUrl.value, srcdoc.value],
  () => {
    loading.value = true
    errorMessage.value = null
    registerBridge()
  },
)

onBeforeUnmount(() => {
  bridgeDisposable?.dispose()
})
</script>

<template>
  <section class="relative h-full min-h-0 bg-background">
    <div
      v-if="loading"
      class="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground"
    >
      <Loader2 class="size-3.5 animate-spin" />
      Loading {{ title }}
    </div>

    <iframe
      v-if="frameUrl || srcdoc"
      ref="iframe"
      :src="frameUrl"
      :srcdoc="srcdoc"
      class="h-full w-full border-0 bg-background"
      :sandbox="sandbox"
      referrerpolicy="no-referrer"
      title="Workbench surface"
      :aria-label="title"
      :data-surface-id="surface.id"
      @load="handleLoad"
      @error="errorMessage = 'The iframe surface failed to load.'"
    />

    <section v-else class="m-4 grid gap-2 rounded-lg border border-border bg-muted/30 p-4">
      <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">
        Missing iframe source
      </h3>
      <p class="m-0 text-sm leading-relaxed text-muted-foreground">
        This surface did not provide a URL, entry, HTML, or srcdoc value.
      </p>
    </section>

    <section
      v-if="errorMessage"
      class="absolute bottom-3 left-3 right-3 z-10 rounded-lg border border-destructive/40 bg-background p-3 shadow-sm"
    >
      <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">Surface error</h3>
      <p class="m-0 mt-1 text-sm leading-relaxed text-muted-foreground">{{ errorMessage }}</p>
    </section>
  </section>
</template>

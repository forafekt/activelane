<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../composables/useWorkbenchRuntime'
import { resolveExtensionAsset } from './assets'
import type { ViewDefinition, ViewInstance } from './model'
import { useViewBridge } from './vueBridge'

const props = defineProps<{
  definition: ViewDefinition
  instanceId: string
  context?: unknown
  title?: string
}>()
const runtime = useWorkbenchRuntime()
const bridge = useViewBridge()
const developerMode = import.meta.env.DEV
const frame = ref<HTMLIFrameElement | null>(null)
const source = ref<string>()
const failure = ref<{
  phase: 'asset-resolution' | 'document-load'
  message: string
  detail?: string
}>()
let diagnosticId: string | undefined
let registration: { dispose(): void } | undefined

const instance = computed<ViewInstance>(() => ({
  id: props.instanceId,
  definitionId: props.definition.id,
  extensionId: props.definition.ownerExtensionId ?? '',
  title: props.title ?? props.definition.title,
  context: props.context,
  dirty: false,
  createdAt: Date.now(),
}))

async function prepare() {
  if (diagnosticId) runtime.diagnostics.clear(diagnosticId)
  diagnosticId = undefined
  failure.value = undefined
  try {
    const renderer = props.definition.renderer
    if (renderer.type !== 'isolated') return
    const resolver = runtime.host.capabilities.extensionAssets
    if (!resolver) throw new Error('This host cannot resolve extension assets.')
    const url = await resolveExtensionAsset(resolver, instance.value.extensionId, renderer.entry)
    const hash = new URLSearchParams({
      alExtension: instance.value.extensionId,
      alView: instance.value.definitionId,
      alInstance: instance.value.id,
    })
    source.value = `${url}${url.includes('#') ? '&' : '#'}${hash}`
  } catch (error) {
    source.value = undefined
    failure.value = {
      phase: 'asset-resolution',
      message: 'The extension asset could not be resolved.',
      detail: error instanceof Error ? error.message : String(error),
    }
    diagnosticId = runtime.diagnostics.report({
      extensionId: instance.value.extensionId,
      severity: 'error',
      source: 'asset',
      code: 'VIEW_ASSET_RESOLUTION_FAILED',
      message: 'The isolated view asset could not be resolved.',
      detail: error instanceof Error ? (error.stack ?? error.message) : String(error),
      viewDefinitionId: instance.value.definitionId,
      viewInstanceId: instance.value.id,
    }).id
  }
}

function documentFailed() {
  failure.value = {
    phase: 'document-load',
    message: 'The extension document could not be loaded.',
  }
  diagnosticId = runtime.diagnostics.report({
    extensionId: instance.value.extensionId,
    severity: 'error',
    source: 'view',
    code: 'VIEW_DOCUMENT_LOAD_FAILED',
    message: 'The isolated extension document failed to load.',
    viewDefinitionId: instance.value.definitionId,
    viewInstanceId: instance.value.id,
  }).id
}

function register() {
  registration?.dispose()
  if (frame.value) {
    registration = bridge.register({
      frame: frame.value,
      definition: props.definition,
      instance: instance.value,
    })
  }
}

watch(frame, register)

watch(
  () => [props.definition, props.instanceId, props.context],
  () => {
    register()
    void prepare()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  registration?.dispose()
  runtime.diagnostics.clearView(instance.value.id)
})
</script>

<template>
  <section v-if="failure" class="grid h-full place-content-center gap-2 p-6 text-center">
    <h3 class="m-0 text-sm font-semibold">Unable to start extension view</h3>
    <p class="m-0 text-sm text-muted-foreground">
      {{ instance.extensionId }}
      · {{ instance.definitionId }}
    </p>
    <p class="m-0 max-w-md text-sm text-destructive">{{ failure.message }}</p>
    <details v-if="failure.detail && developerMode" class="max-w-lg text-left text-xs">
      <summary>Diagnostic details</summary>
      <pre class="mt-2 whitespace-pre-wrap">{{ failure.phase }}: {{ failure.detail }}</pre>
    </details>
    <button
      type="button"
      class="mx-auto rounded border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
      @click="prepare"
    >
      Retry
    </button>
    <button
      type="button"
      class="mx-auto text-sm text-muted-foreground underline"
      @click="runtime.commands.execute('workbench.extensions.openDiagnostics')"
    >
      Open diagnostics
    </button>
  </section>
  <section v-else class="relative h-full w-full">
    <iframe
      ref="frame"
      :src="source ?? 'about:blank'"
      :title="instance.title"
      class="h-full w-full border-0 bg-background"
      sandbox="allow-scripts"
      referrerpolicy="no-referrer"
      @error="documentFailed"
    />
    <div
      v-if="!source"
      class="absolute inset-0 grid place-content-center bg-background text-sm text-muted-foreground"
    >
      Loading extension view…
    </div>
  </section>
</template>

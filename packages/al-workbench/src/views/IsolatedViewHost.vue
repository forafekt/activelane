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
const frame = ref<HTMLIFrameElement | null>(null)
const source = ref<string>()
const failure = ref<string>()
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
    failure.value = error instanceof Error ? error.message : String(error)
  }
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
onBeforeUnmount(() => registration?.dispose())
</script>

<template>
  <section v-if="failure" class="grid h-full place-content-center gap-2 p-6 text-center">
    <h3 class="m-0 text-sm font-semibold">Unable to load extension view</h3>
    <p class="m-0 text-sm text-muted-foreground">
      {{ instance.extensionId }}
      · {{ instance.definitionId }}
    </p>
    <p class="m-0 max-w-md text-sm text-destructive">{{ failure }}</p>
  </section>
  <iframe
    v-else-if="source"
    ref="frame"
    :src="source"
    :title="instance.title"
    class="h-full w-full border-0 bg-background"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    @error="failure = 'The packaged view document could not be loaded.'"
  />
  <div v-else class="grid h-full place-content-center text-sm text-muted-foreground">
    Loading extension view…
  </div>
</template>

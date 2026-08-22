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
}

function loaded() {
  registration?.dispose()
  if (frame.value) {
    registration = bridge.register({
      frame: frame.value,
      definition: props.definition,
      instance: instance.value,
    })
  }
}

watch(
  () => [props.definition, props.instanceId],
  () => void prepare(),
  { immediate: true },
)
onBeforeUnmount(() => registration?.dispose())
</script>

<template>
  <iframe
    ref="frame"
    :src="source"
    :title="instance.title"
    class="h-full w-full border-0 bg-background"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    @load="loaded"
  />
</template>

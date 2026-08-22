<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'
import IsolatedViewHost from '../../views/IsolatedViewHost.vue'
import WorkbenchNativeVueSurface from './WorkbenchNativeVueSurface.vue'
import WorkbenchUnsupportedSurface from './WorkbenchUnsupportedSurface.vue'

defineOptions({ name: 'WorkbenchSurfaceHost' })

const props = defineProps<{
  tab: WorkbenchTab
  surface: WorkbenchSurfaceDescriptor
}>()

const runtime = useWorkbenchRuntime()

const surfaceComponent = computed(() => {
  if (props.surface.mode === 'webview') return WorkbenchUnsupportedSurface

  switch (props.surface.mode) {
    case 'native-vue':
      return WorkbenchNativeVueSurface
    case 'isolated':
      return IsolatedViewHost
    default:
      return WorkbenchUnsupportedSurface
  }
})

watchEffect(() => {
  if (!runtime.settings.get<boolean>('workbench.developer.showDiagnostics')) return
  console.debug('[ActiveLane Surface] host route', {
    tabId: props.tab.id,
    surfaceId: props.surface.id,
    mode: props.surface.mode,
    component: surfaceComponent.value.name,
  })
})
</script>

<template>
  <IsolatedViewHost
    v-if="surface.mode === 'isolated'"
    :key="surface.instanceId"
    :definition="surface.view"
    :instance-id="surface.instanceId"
    :context="surface.context"
    :title="surface.title"
    class="h-full min-h-0"
  />
  <component v-else :is="surfaceComponent" :tab="tab" :surface="surface" class="h-full min-h-0" />
</template>

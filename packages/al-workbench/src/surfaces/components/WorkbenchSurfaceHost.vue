<script setup lang="ts">
import type { WorkbenchSurfaceDescriptor, WorkbenchTab } from '@activelane/workbench-api'
import { computed, watchEffect } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import WorkbenchIframeSurface from './WorkbenchIframeSurface.vue'
import WorkbenchNativeVueSurface from './WorkbenchNativeVueSurface.vue'
import WorkbenchShadowDomSurface from './WorkbenchShadowDomSurface.vue'
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
    case 'shadow-dom':
      return WorkbenchShadowDomSurface
    case 'iframe':
    case 'external-url':
      return WorkbenchIframeSurface
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
  <component :is="surfaceComponent" :tab="tab" :surface="surface" class="h-full min-h-0" />
</template>

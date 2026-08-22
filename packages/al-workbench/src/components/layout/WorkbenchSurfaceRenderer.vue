<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

import WorkbenchSurfaceHost from '../../surfaces/components/WorkbenchSurfaceHost.vue'
import {
  resolveWorkbenchTabSurface,
  unsupportedSurface,
} from '../../surfaces/services/surfaceResolver'

defineOptions({ name: 'WorkbenchSurfaceRenderer' })

const props = defineProps<{
  tab: WorkbenchTab
}>()

const runtime = useWorkbenchRuntime()

const resolvedSurface = shallowRef<WorkbenchSurfaceDescriptor>(
  unsupportedSurface(props.tab, 'Resolving surface.'),
)

const surfaceResolutionKey = computed(() => {
  const tab = props.tab
  return [
    tab.id,
    tab.kind,
    tab.surfaceId ?? '',
    tab.ownerExtensionId ?? '',
    inlineSurfaceKey(tab.surface),
    matchingRendererKey(tab),
    matchingTabSurfaceKey(tab),
  ].join('\u001f')
})

watch(
  surfaceResolutionKey,
  async (_key, _oldKey, onCleanup) => {
    let disposed = false
    onCleanup(() => {
      disposed = true
    })

    try {
      const surface = await resolveWorkbenchTabSurface(props.tab, runtime)
      if (!disposed && !sameResolvedSurface(resolvedSurface.value, surface)) {
        resolvedSurface.value = surface
        if (runtime.settings.get<boolean>('workbench.developer.showDiagnostics')) {
          console.debug('[ActiveLane Surface] resolved tab surface', {
            tabId: props.tab.id,
            tabKind: props.tab.kind,
            surfaceId: surface.id,
            mode: surface.mode,
            ownerExtensionId: surface.ownerExtensionId,
          })
        }
      }
    } catch (error) {
      if (!disposed) {
        const fallback = unsupportedSurface(
          props.tab,
          error instanceof Error ? error.message : String(error),
        )
        if (!sameResolvedSurface(resolvedSurface.value, fallback)) {
          resolvedSurface.value = fallback
        }
      }
    }
  },
  { immediate: true },
)

function inlineSurfaceKey(surface: WorkbenchTab['surface']) {
  if (!surface) return ''
  return [
    surface.id,
    surface.mode,
    surface.ownerExtensionId ?? '',
    surface.component ? 'component' : '',
    surface.url ?? '',
    surface.entry ?? '',
    surface.srcdoc ? 'srcdoc' : '',
    surface.html ? 'html' : '',
  ].join('\u001e')
}

function matchingRendererKey(tab: WorkbenchTab) {
  const renderer = runtime.registry.tabRenderers.find(
    (item) => item.tabKind === tab.kind || item.id === tab.kind,
  )
  if (!renderer) return ''
  return [
    renderer.id,
    renderer.tabKind,
    renderer.ownerExtensionId ?? '',
    renderer.component ? 'component' : '',
    renderer.surface ? 'surface' : '',
  ].join('\u001e')
}

function matchingTabSurfaceKey(tab: WorkbenchTab) {
  const surface = runtime.registry.tabSurfaces.find(
    (item) =>
      item.id === tab.surfaceId ||
      item.tabKind === tab.kind ||
      item.id === tab.kind ||
      item.id === tab.id,
  )
  if (!surface) return ''
  return [
    surface.id,
    surface.tabKind ?? '',
    surface.mode,
    surface.ownerExtensionId ?? '',
    surface.component ? 'component' : '',
    surface.url ?? '',
    surface.entry ?? '',
  ].join('\u001e')
}

function sameResolvedSurface(
  left: WorkbenchSurfaceDescriptor | undefined,
  right: WorkbenchSurfaceDescriptor,
) {
  if (!left) return false
  const sameBase =
    left.id === right.id &&
    left.mode === right.mode &&
    left.ownerExtensionId === right.ownerExtensionId &&
    left.component === right.component &&
    left.url === right.url &&
    left.entry === right.entry &&
    left.srcdoc === right.srcdoc &&
    left.html === right.html &&
    left.fallback?.title === right.fallback?.title &&
    left.fallback?.message === right.fallback?.message
  if (!sameBase) return false
  if (left.mode === 'isolated' && right.mode === 'isolated') {
    return left.instanceId === right.instanceId && left.context === right.context
  }
  return true
}
</script>

<template>
  <WorkbenchSurfaceHost :tab="tab" :surface="resolvedSurface" />
</template>

<script setup lang="ts">
import { computed, onErrorCaptured, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

defineOptions({ name: 'WorkbenchNativeVueSurface' })

const props = defineProps<{
  tab: WorkbenchTab
  surface: WorkbenchSurfaceDescriptor
}>()

const runtime = useWorkbenchRuntime()

const [AlAlert, AlButton] = runtime.workbench.ui.getComponents(['Alert', 'Button'])

const errorMessage = ref<string | null>(null)
const surfaceProps = computed(() => ({
  ...(props.surface.props ?? props.surface.passThrough ?? {}),
  tab: props.tab,
  runtime,
}))

watch(
  () => [props.surface.id, props.surface.component],
  () => {
    errorMessage.value = null
    if (props.surface.ownerExtensionId) {
      runtime.extensions.clearSurfaceErrors(props.surface.ownerExtensionId, props.surface.id)
    }
  },
)

onErrorCaptured((error) => {
  errorMessage.value = error instanceof Error ? error.message : String(error)
  if (props.surface.ownerExtensionId) {
    runtime.extensions.reportSurfaceError(props.surface.ownerExtensionId, {
      surface: 'tab',
      contributionId: props.surface.id,
      message: errorMessage.value,
    })
  }
  return false
})
</script>

<template>
  <component
    :key="surface.id"
    :is="surface.component"
    v-if="surface.component && !errorMessage"
    v-bind="surfaceProps"
    class="h-full min-h-0"
  />

  <div v-else class="p-4">
    <AlAlert variant="destructive">
      <div class=" grid gap-3 ">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Native Vue surface
        </p>
        <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">
          {{ errorMessage ? 'Surface failed' : 'Missing component' }}
        </h3>
        <p class="m-0 text-sm leading-relaxed text-muted-foreground">
          {{ errorMessage ?? `No Vue component was provided for ${surface.title ?? tab.title}.` }}
        </p>
        <AlButton
          v-if="errorMessage"
          type="button"
          size="xs"
          class="justify-self-start"
          @click="errorMessage = null"
        >
          Retry surface
        </AlButton>
      </div>
    </AlAlert>
  </div>
</template>

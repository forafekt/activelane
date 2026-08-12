<script setup lang="ts">
import type { Component } from 'vue'
import { onErrorCaptured, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchExtensionBoundary' })

const props = defineProps<{
  component: Component
  extensionId?: string
  extensionName?: string
  contributionId: string
  surface: 'tab' | 'sidebar' | 'inspector'
  passThrough?: Record<string, unknown>
}>()

const runtime = useWorkbenchRuntime()

const [AlAlert, AlButton] = runtime.workbench.ui.getComponents(['AlAlert', 'AlButton'])

const errorMessage = ref<string | null>(null)

watch(
  () => [props.extensionId, props.contributionId, props.component],
  () => {
    errorMessage.value = null
    if (props.extensionId)
      runtime.extensions.clearSurfaceErrors(props.extensionId, props.contributionId)
  },
)

onErrorCaptured((error) => {
  errorMessage.value = error instanceof Error ? error.message : String(error)
  if (props.extensionId) {
    runtime.extensions.reportSurfaceError(props.extensionId, {
      surface: props.surface,
      contributionId: props.contributionId,
      message: errorMessage.value,
    })
  }
  return false
})
</script>

<template>
  <component :is="component" v-if="!errorMessage" v-bind="passThrough ?? {}" />

  <div v-else class="p-4">
    <AlAlert variant="destructive">
      <div class="grid gap-2">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {{ surface }}
          failure
        </p>
        <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">
          {{ extensionName ?? extensionId ?? 'Unknown extension' }}
        </h3>
        <p class="m-0 text-sm leading-relaxed text-muted-foreground">{{ errorMessage }}</p>
        <AlButton type="button" size="xs" class="justify-self-start" @click="errorMessage = null">
          Retry surface
        </AlButton>
      </div>
    </AlAlert>
  </div>
</template>

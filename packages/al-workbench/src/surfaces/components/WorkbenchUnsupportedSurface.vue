<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed } from 'vue'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

const AlertTriangle = getIcon('lucide.triangle-alert')

defineOptions({ name: 'WorkbenchUnsupportedSurface' })

const props = defineProps<{
  tab: WorkbenchTab
  surface: WorkbenchSurfaceDescriptor
}>()

const title = computed(() => props.surface.fallback?.title ?? 'Unsupported surface')
const message = computed(
  () =>
    props.surface.fallback?.message ??
    `Surface mode ${props.surface.mode} is not available in this workbench host.`,
)
</script>

<template>
  <section
    data-surface-id="unsupported"
    class="grid h-full min-h-0 place-items-center bg-background p-6"
  >
    <div class="grid max-w-md gap-3 rounded-lg border border-border bg-muted/30 p-5 text-center">
      <div
        class="mx-auto grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"
      >
        <AlertTriangle class="size-4" />
      </div>
      <div class="grid gap-1">
        <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">{{ title }}</h3>
        <p class="m-0 text-sm leading-relaxed text-muted-foreground">{{ message }}</p>
      </div>
    </div>
  </section>
</template>

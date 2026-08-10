<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench-api'
import { computed } from 'vue'

defineOptions({ name: 'SurfacePlaygroundView' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const [AlBadge, AlPanel, AlStatBlock] = props.runtime.workbench.ui.getComponents([
  'AlBadge',
  'AlPanel',
  'AlStatBlock',
])

const mode = computed(() => props.tab.surface?.mode ?? props.tab.input?.mode ?? 'native-vue')
const mount = computed(() => props.tab.input?.mount ?? 'native')
</script>

<template>
  <section class="grid h-full min-h-0 content-start gap-4 overflow-auto bg-background p-5">
    <header class="flex items-start justify-between gap-3">
      <div class="grid gap-1">
        <p class="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Surface Playground
        </p>
        <h1 class="m-0 text-xl font-semibold tracking-tight text-foreground">{{ tab.title }}</h1>
      </div>
      <AlBadge variant="outline">{{ mode }}</AlBadge>
    </header>

    <section class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <AlStatBlock label="Tab" :value="tab.id" />
      <AlStatBlock label="Surface" :value="tab.surface?.id ?? tab.surfaceId ?? 'registry'" />
      <AlStatBlock label="Mount" :value="String(mount)" />
    </section>

    <AlPanel class="grid gap-3 p-4">
      <h2 class="m-0 text-sm font-semibold text-foreground">Descriptor</h2>
      <pre
        class="m-0 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
      >{{ JSON.stringify({ id: tab.surface?.id, mode: tab.surface?.mode, ownerExtensionId: tab.surface?.ownerExtensionId }, null, 2) }}</pre>
    </AlPanel>
  </section>
</template>

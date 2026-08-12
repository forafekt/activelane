<script setup lang="ts">
import type { WorkbenchHost, WorkbenchRuntimeApi } from '@activelane/workbench'
import { WorkbenchShell } from '@activelane/workbench'
import { onUnmounted } from 'vue'

defineOptions({ name: 'App' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  host: WorkbenchHost
}>()

onUnmounted(() => {
  void props.runtime.dispose()
})
</script>

<template>
  <WorkbenchShell :runtime="runtime" :host="host" />
</template>

<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { useDesktopWindowChrome } from './host/windowChrome'

defineOptions({ name: 'App' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  provideWorkbenchRuntime: (runtime: WorkbenchRuntimeApi) => void
}>()

props.provideWorkbenchRuntime(props.runtime)
const chrome = useDesktopWindowChrome()
</script>

<template>
  <workbench-shell :runtime="runtime" :top-bar="false">
    <template #titlebar>
      <workbench-title-bar :chrome="chrome" :platform="chrome.os" />
    </template>
  </workbench-shell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// import { normalizeOperatingSystem } from '../host/windowChrome.ts'
import WorkbenchTitleBarLinux from '../../../linux/components/title-bar/WorkbenchTitleBarLinux.vue'
import WorkbenchTitleBarMacOS from '../../../mac/components/title-bar/WorkbenchTitleBarMacOS.vue'
import WorkbenchTitleBarWindows from '../../../windows/components/title-bar/WorkbenchTitleBarWindows.vue'

defineOptions({ name: 'WorkbenchTitleBar' })

const props = defineProps<{
  platform?: string
  chrome: any
}>()

const operatingSystem = computed(() => props.platform ?? props.chrome.os ?? 'linux')
const titleBarComponent = computed(() => {
  if (operatingSystem.value === 'macos') return WorkbenchTitleBarMacOS
  if (operatingSystem.value === 'windows') return WorkbenchTitleBarWindows
  return WorkbenchTitleBarLinux
})
</script>

<template>
  <component :is="titleBarComponent" :chrome="props.chrome" />
</template>

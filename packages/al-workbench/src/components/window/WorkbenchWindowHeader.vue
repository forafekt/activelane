<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchHost } from '../../core/host/types'
import LinuxWindowHeader from './native/LinuxWindowHeader.vue'
import MacWindowHeader from './native/MacWindowHeader.vue'
import WindowsWindowHeader from './native/WindowsWindowHeader.vue'
import WebWindowHeader from './WebWindowHeader.vue'

const props = defineProps<{ host: WorkbenchHost }>()

const header = computed(() => {
  if (!props.host.window) return WebWindowHeader
  if (props.host.platform === 'macos') return MacWindowHeader
  if (props.host.platform === 'windows') return WindowsWindowHeader
  return LinuxWindowHeader
})
</script>

<template>
  <component :is="header" :window-host="host.window" />
</template>

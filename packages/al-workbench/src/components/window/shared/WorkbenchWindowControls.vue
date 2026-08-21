<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { getComponent } from '@activelane/ui'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchWindowHost } from '../../../core/host/types'

const IconButton = getComponent('icon-button')

defineOptions({ name: 'WorkbenchWindowControls' })

const props = defineProps<{
  windowHost: WorkbenchWindowHost
}>()
const runtime = useWorkbenchRuntime()

function minimizeWindow() {
  void props.windowHost.minimize()
}

function maximizeWindow() {
  void props.windowHost.toggleMaximize()
}

async function closeWindow() {
  const shouldClose =
    (await runtime.host.capabilities.confirm?.({
      title: 'Close ActiveLane',
      message: 'Are you sure you want to close this window?',
      confirmLabel: 'Close',
      cancelLabel: 'Cancel',
    })) ?? true
  if (!shouldClose) return
  void (await props.windowHost.close())
}
</script>

<template>
  <div class="flex flex-row gap-2 ml-2 pl-2 border-l" data-workbench-no-drag>
    <IconButton
      label="Minimize"
      :icon="getIcon('lucide:minus')"
      size="tiny"
      @click="minimizeWindow"
    />
    <IconButton
      :label="windowHost.state.maximized ? 'Restore' : 'Maximize'"
      :icon="windowHost.state.maximized ? getIcon('lucide:square') : getIcon('lucide:copy')"
      size="tiny"
      @click="maximizeWindow"
    />
    <IconButton label="Close" :icon="getIcon('lucide:x')" size="tiny" @click="closeWindow" />
  </div>
</template>

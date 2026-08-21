<script setup lang="ts">
import { IconButton } from '@activelane/shadcn'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchWindowHost } from '../../../core/host/types'
import { getWorkbenchIcon, getWorkbenchIcons } from '../../../workbenchIcons'

const [MinimizeWindow, CloseWindow] = getWorkbenchIcons([['MinimizeWindow'], ['CloseWindow']])

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
  await props.windowHost.close()
}
</script>

<template>
  <div class="flex flex-row gap-2 ml-2 pl-2 border-l" data-workbench-no-drag>
    <IconButton
      label="Minimize"
      :icon="MinimizeWindow"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="minimizeWindow"
    />
    <IconButton
      :label="windowHost.state.maximized ? 'Restore' : 'Maximize'"
      :icon="getWorkbenchIcon('MaximizeWindow', 'RestoreDownWindow', windowHost.state.maximized)"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="maximizeWindow"
    />
    <IconButton
      label="Close"
      :icon="CloseWindow"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="void closeWindow()"
    />
  </div>
</template>

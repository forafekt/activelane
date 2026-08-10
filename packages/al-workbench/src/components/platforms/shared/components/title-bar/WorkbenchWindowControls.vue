<script setup lang="ts">
import { AlIconButton } from '@activelane/shadcn'
import { getWorkbenchIcon, getWorkbenchIcons } from '../../../../../workbenchIcons'
import type { WorkbenchWindowChrome } from '../../../windowChrome'

const [MinimizeWindow, CloseWindow] = getWorkbenchIcons([['MinimizeWindow'], ['CloseWindow']])

defineOptions({ name: 'WorkbenchWindowControls' })

const props = defineProps<{
  chrome: WorkbenchWindowChrome
}>()

function minimizeWindow() {
  void props.chrome.minimize()
}

function maximizeWindow() {
  void props.chrome.toggleMaximize()
}

function closeWindow() {
  const shouldClose = window.confirm('Are you sure you want to close this window?')
  if (!shouldClose) return
  void props.chrome.close()
}
</script>

<template>
  <div class="flex flex-row gap-2 ml-2 pl-2 border-l" data-workbench-no-drag>
    <AlIconButton
      label="Minimize"
      :icon="MinimizeWindow"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="minimizeWindow"
    />
    <AlIconButton
      :label="chrome.state.maximized ? 'Restore' : 'Maximize'"
      :icon="getWorkbenchIcon('MaximizeWindow', 'RestoreDownWindow', chrome.state.maximized)"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="maximizeWindow"
    />
    <AlIconButton
      label="Close"
      :icon="CloseWindow"
      size="icon-xs"
      variant="subtle"
      class="rounded-full"
      @click="closeWindow"
    />
  </div>
</template>

<style scoped>
.workbench-title-bar__traffic {
  display: flex;
  flex: 0 0 auto;
  align-self: stretch;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
  min-width: 0;
  padding-inline: 0.125rem;
}
</style>

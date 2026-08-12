<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchNavigationControls' })

const runtime = useWorkbenchRuntime()
const canGoBack = computed(() => runtime.workbench.state.navigation.back.length > 0)
const canGoForward = computed(() => runtime.workbench.state.navigation.forward.length > 0)

const [ChevronLeft, ChevronRight] = runtime.workbench.ui.getIcons(['ChevronLeft', 'ChevronRight'])
const [AlIconButton] = runtime.workbench.ui.getComponents(['AlIconButton'])
</script>

<template>
  <div class="workbench-window-header__navigation" data-workbench-no-drag>
    <AlIconButton
      label="Back"
      :icon="ChevronLeft"
      size="icon-xs"
      variant="ghost"
      :disabled="!canGoBack"
      @click="runtime.workbench.navigateBack()"
    />
    <AlIconButton
      label="Forward"
      :icon="ChevronRight"
      size="icon-xs"
      variant="ghost"
      :disabled="!canGoForward"
      @click="runtime.workbench.navigateForward()"
    />
  </div>
</template>

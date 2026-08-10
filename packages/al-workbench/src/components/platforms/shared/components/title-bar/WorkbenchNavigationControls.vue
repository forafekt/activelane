<script setup lang="ts">
import { useWorkbenchRuntime } from '../../../../../composables/useWorkbenchRuntime'
// import { getIcons } from '@activelane/icons'
// import { AlIconButton } from '@activelane/shadcn'

import { computed } from 'vue'

defineOptions({ name: 'WorkbenchNavigationControls' })

const runtime = useWorkbenchRuntime()
const canGoBack = computed(() => runtime.workbench.state.navigation.back.length > 0)
const canGoForward = computed(() => runtime.workbench.state.navigation.forward.length > 0)

const [ChevronLeft, ChevronRight] = runtime.workbench.ui.getIcons(['ChevronLeft', 'ChevronRight'])
const [AlIconButton] = runtime.workbench.ui.getComponents(['AlIconButton'])
</script>

<template>
  <div class="workbench-title-bar__navigation" data-workbench-no-drag>
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

<style scoped>
.workbench-title-bar__navigation {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.125rem;
  min-width: 0;
}
</style>

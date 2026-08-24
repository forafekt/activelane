<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { getComponent } from '@activelane/ui'
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'


defineOptions({ name: 'WorkbenchNavigationControls' })

const runtime = useWorkbenchRuntime()
const canGoBack = computed(() => runtime.workbench.state.navigation.back.length > 0)
const canGoForward = computed(() => runtime.workbench.state.navigation.forward.length > 0)

const ChevronLeft = getIcon('lucide:arrow-left')
const ChevronRight = getIcon('lucide:arrow-right')
const IconButton = getComponent('icon-button')

function navigateBack() {
  void runtime.workbench.navigateBack()
}

function navigateForward() {
  void runtime.workbench.navigateForward()
}

</script>

<template>
  <div class="workbench-window-header__navigation" data-workbench-no-drag>
    <IconButton
      label="Back"
      :icon="ChevronLeft"
      size="tiny"
      variant="ghost"
      :disabled="!canGoBack"
      @click="navigateBack"
    />
    <IconButton
      label="Forward"
      :icon="ChevronRight"
      size="tiny"
      variant="ghost"
      :disabled="!canGoForward"
      @click="navigateForward"
    />
  </div>
</template>

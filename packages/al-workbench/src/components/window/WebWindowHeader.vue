<script setup lang="ts">
import { IconButton } from '@activelane/shadcn'
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import { getWorkbenchIcon } from '../../workbenchIcons'
import { WorkbenchCommandBar } from '../navigation/command/WorkbenchCommandPalette'
import { WorkbenchGlobalMenuLauncher } from '../navigation/menus'
import WorkbenchLayoutControls from './WorkbenchLayoutControls.vue'
import WorkbenchTitleBarBrand from './shared/WorkbenchTitleBarBrand.vue'

defineOptions({ name: 'WebWindowHeader' })

const runtime = useWorkbenchRuntime()

const canGoBack = computed(() => runtime.workbench.state.navigation.back.length > 0)
const canGoForward = computed(() => runtime.workbench.state.navigation.forward.length > 0)
</script>

<template>
  <header class="wb-window-header" data-workbench-part="windowHeader">
    <div class="wb-window-header__left">
      <WorkbenchTitleBarBrand />
      <WorkbenchGlobalMenuLauncher placement="topBar" labels />
      <div class="wb-window-header__center">
        <IconButton
          label="Back"
          :icon="getWorkbenchIcon('ChevronLeft')"
          size="icon-sm"
          variant="ghost"
          :disabled="!canGoBack"
          @click="runtime.workbench.navigateBack()"
        />
        <IconButton
          label="Forward"
          :icon="getWorkbenchIcon('ChevronRight')"
          size="icon-sm"
          variant="ghost"
          :disabled="!canGoForward"
          @click="runtime.workbench.navigateForward()"
        />
        <WorkbenchCommandBar />
      </div>
    </div>

    <WorkbenchLayoutControls class="wb-window-header__layout" />
  </header>
</template>

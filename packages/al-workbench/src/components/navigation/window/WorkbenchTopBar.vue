<script setup lang="ts">
import { AlIconButton } from '@activelane/shadcn'
import { computed } from 'vue'
import { useWorkbenchHostChrome } from '../../../composables/useWorkbenchHostChrome'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { getWorkbenchIcon } from '../../../workbenchIcons'
import { WorkbenchCommandBar } from '../command/WorkbenchCommandPalette/index.ts'
import { WorkbenchGlobalMenuLauncher } from '../menus/index.ts'
import { WorkbenchLayoutControls } from './index.ts'

defineOptions({ name: 'WorkbenchTopBar' })

withDefaults(
  defineProps<{
    commandBar?: boolean
  }>(),
  {
    commandBar: true,
  },
)

const runtime = useWorkbenchRuntime()
const chrome = useWorkbenchHostChrome(runtime)
const showGlobalMenuInTopBar = chrome.showGlobalMenuInTopBar

const canGoBack = computed(() => runtime.workbench.state.navigation.back.length > 0)
const canGoForward = computed(() => runtime.workbench.state.navigation.forward.length > 0)
</script>

<template>
  <header class="wb-top-bar" data-workbench-part="topBar">
    <div class="wb-top-bar__left">
      <WorkbenchGlobalMenuLauncher v-if="showGlobalMenuInTopBar" placement="topBar" labels />
      <div class="wb-top-bar__center">
        <AlIconButton
          label="Back"
          :icon="getWorkbenchIcon('ChevronLeft')"
          size="icon-sm"
          variant="ghost"
          :disabled="!canGoBack"
          @click="runtime.workbench.navigateBack()"
        />
        <AlIconButton
          label="Forward"
          :icon="getWorkbenchIcon('ChevronRight')"
          size="icon-sm"
          variant="ghost"
          :disabled="!canGoForward"
          @click="runtime.workbench.navigateForward()"
        />
        <WorkbenchCommandBar v-if="commandBar" />
      </div>
    </div>

    <WorkbenchLayoutControls class="wb-top-bar__layout" />
  </header>
</template>

<style scoped>
.wb-top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 0 2.375rem;
  box-sizing: border-box;
  height: 2.375rem;
  min-height: 0;
  gap: 0.375rem;
  border-bottom: 1px solid var(--border);
  background: var(--titlebar);
  box-shadow: var(--elevation-1);
  backdrop-filter: blur(18px) saturate(1.08);
  padding: 0 0.5rem;
}

.wb-top-bar__center {
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 0.125rem;
}

.wb-top-bar__left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 0.375rem;
}

.wb-top-bar :deep(.wb-command-bar) {
  flex: 1 1 18rem;
  max-width: 42rem;
}

.wb-top-bar__layout {
  flex: 0 0 auto;
  margin-left: auto;
  justify-content: end;
}
</style>

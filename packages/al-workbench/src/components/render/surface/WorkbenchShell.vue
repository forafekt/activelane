<script setup lang="ts">
import type {
  WorkbenchRegisteredContributions,
  WorkbenchRuntimeApi,
  WorkbenchShellApi,
} from '@activelane/workbench-api'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createLegacyWorkbenchRuntime } from '../../../compat'
import { provideWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { useWorkbenchShellKeybindings } from '../../../composables/useWorkbenchShellKeybindings'
import { useWorkbenchShellSettings } from '../../../composables/useWorkbenchShellSettings'
import {
  createApplicationRegistryService,
  LauncherOverlay,
  provideLauncher,
} from '../../../launcher'
import { provideSurfaceBridge } from '../../../surfaces/composables/useSurfaceBridge'
import WorkbenchTabWorkspaceDialog from '../tabs/main/WorkbenchTabWorkspaceDialog.vue'
import WorkbenchChromeLayout from './WorkbenchChromeLayout.vue'

defineOptions({ name: 'WorkbenchShell' })

const props = withDefaults(
  defineProps<{
    runtime: WorkbenchRuntimeApi
    store?: WorkbenchShellApi
    registry?: WorkbenchRegisteredContributions
    topBar?: boolean
  }>(),
  {
    topBar: true,
  },
)

const [SidebarProvider] = props.runtime.workbench.ui.getComponents(['SidebarProvider'])

const activeRuntime = computed(() => {
  if (props.runtime) return props.runtime
  if (props.store && props.registry)
    return createLegacyWorkbenchRuntime(props.store, props.registry)
  throw new Error('WorkbenchShell requires either a runtime or legacy store and registry props.')
})

provideWorkbenchRuntime(activeRuntime.value)
provideLauncher(createApplicationRegistryService(activeRuntime.value))
const surfaceBridge = provideSurfaceBridge(activeRuntime.value)
const hostRef = ref<HTMLElement | null>(null)
const shellRuntime = activeRuntime.value

const sidebarOpen = computed({
  get: () => !shellRuntime.workbench.state.sidebar.collapsed,
  set: (open: boolean) => {
    shellRuntime.workbench.setSidebarCollapsed(!open)
    void shellRuntime.workbench.persist()
  },
})

const shellClass = computed(() => [
  'wb-shell',
  `wb-shell--activity-${shellRuntime.workbench.state.layoutPreference.activityRailLocation}`,
  shellRuntime.settings.get<string>('workbench.appearance.density') === 'comfortable'
    ? 'wb-shell--comfortable'
    : 'wb-shell--compact',
])

useWorkbenchShellSettings(shellRuntime, hostRef)
useWorkbenchShellKeybindings(shellRuntime)

onMounted(() => {
  if (!shellRuntime.workbench.state.activeActivityId && shellRuntime.registry.activityRail[0]) {
    shellRuntime.workbench.setActiveActivity(shellRuntime.registry.activityRail[0].id)
  }
})

onUnmounted(() => {
  surfaceBridge.dispose()
})
</script>

<template>
  <div class="wb-shell-root">
    <slot name="titlebar" />
    <div class="wb-shell-container">
      <SidebarProvider :open="sidebarOpen" @update:open="sidebarOpen = $event">
        <section ref="hostRef" :class="shellClass" :data-host-mode="shellRuntime.host.mode">
          <WorkbenchChromeLayout :top-bar="props.topBar" />
          <LauncherOverlay />
          <WorkbenchTabWorkspaceDialog />
        </section>
      </SidebarProvider>
    </div>
  </div>
</template>

<style scoped>
.wb-shell-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--background);
}

.wb-shell-container {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.wb-shell-container > :deep(*) {
  height: 100%;
  min-height: 0;
}

.wb-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  /* user-select: none; */
  font-size: var(--font-size, 13px);

  /* color: var(--text-primary);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--titlebar) 92%, transparent),
    var(--surface) 11rem
  ); */
}

.wb-shell[data-density="comfortable"] {
  --density-y: 0.625rem;
}

.wb-shell[data-density="compact"] {
  --density-y: 0.375rem;
}

.wb-shell[data-tabs-visible="false"] :deep([data-tabbed-workspace="true"]) {
  display: none;
}

.wb-shell[data-reduced-motion="true"],
.wb-shell[data-reduced-motion="true"] :deep(*) {
  animation-duration: 0.001ms;
  transition-duration: 0.001ms;
}
</style>

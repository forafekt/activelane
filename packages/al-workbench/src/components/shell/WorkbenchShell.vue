<script setup lang="ts">
import { UiProvider } from '@activelane/ui/providers'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { provideWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import { useWorkbenchShellKeybindings } from '../../composables/useWorkbenchShellKeybindings'
import { useWorkbenchShellSettings } from '../../composables/useWorkbenchShellSettings'
import type { WorkbenchHost } from '../../core/host/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import { createApplicationRegistryService, LauncherOverlay, provideLauncher } from '../../launcher'
import { provideSurfaceBridge } from '../../surfaces/composables/useSurfaceBridge'
import WorkbenchTabWorkspaceDialog from '../editor/tabs/WorkbenchTabWorkspaceDialog.vue'
import WorkbenchLayout from '../layout/WorkbenchLayout.vue'
import WorkbenchWindowHeader from '../window/WorkbenchWindowHeader.vue'

defineOptions({ name: 'WorkbenchShell' })

const props = withDefaults(
  defineProps<{
    runtime: WorkbenchRuntimeApi
    host?: WorkbenchHost
  }>(),
  {
    host: () => ({ platform: 'web' }),
  },
)

const SidebarProvider = props.runtime.workbench.ui.getComponent('SidebarProvider')

provideWorkbenchRuntime(props.runtime)
const launcher = createApplicationRegistryService(props.runtime)
provideLauncher(launcher)
const surfaceBridge = provideSurfaceBridge(props.runtime)
const hostRef = ref<HTMLElement | null>(null)
const shellRuntime = props.runtime

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
  launcher.dispose()
  surfaceBridge.dispose()
})
</script>

<template>
  <UiProvider>
    <div data-workbench-part="root" class="wb-shell-root">
      <div class="wb-shell-atmosphere"></div>

      <slot name="window-header" :host="props.host">
        <WorkbenchWindowHeader :host="props.host" />
      </slot>
      <div data-workbench-part="container" class="wb-shell-container">
        <SidebarProvider :open="sidebarOpen" @update:open="sidebarOpen = $event">
          <section
            data-workbench-part="layout"
            ref="hostRef"
            :class="shellClass"
            :data-host-mode="shellRuntime.host.mode"
          >
            <WorkbenchLayout />
            <LauncherOverlay />
            <WorkbenchTabWorkspaceDialog />
          </section>
        </SidebarProvider>
      </div>
    </div>
  </UiProvider>
</template>

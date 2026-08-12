<script setup lang="ts">
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import { getWorkbenchIcon } from '../../workbenchIcons'

defineOptions({ name: 'WorkbenchLayoutControls' })

const runtime = useWorkbenchRuntime()

const [AlIconButton] = runtime.workbench.ui.getComponents(['AlIconButton'])

function toggleSidebar() {
  runtime.workbench.setSidebarCollapsed(!runtime.workbench.state.sidebar.collapsed)
  void runtime.workbench.persist()
}

function toggleBottomPanel() {
  runtime.workbench.setBottomPanelOpen(!runtime.workbench.state.bottomPanel.open)
  void runtime.workbench.persist()
}

function toggleInspector() {
  runtime.workbench.setInspectorCollapsed(!runtime.workbench.state.inspector.collapsed)
  void runtime.workbench.persist()
}
</script>

<template>
  <div class="wb-layout-controls">
    <AlIconButton
      label="Toggle sidebar"
      :icon="getWorkbenchIcon('PanelLeft' , 'PanelLeftFill', !runtime.workbench.state.sidebar.collapsed)"
      size="icon-xs"
      variant="ghost"
      @click="toggleSidebar"
    />
    <AlIconButton
      label="Toggle bottom panel"
      :icon="getWorkbenchIcon( 'PanelBottom', 'PanelBottomFill', runtime.workbench.state.bottomPanel.open)"
      size="icon-xs"
      variant="ghost"
      @click="toggleBottomPanel"
    />
    <AlIconButton
      label="Toggle inspector"
      :icon="getWorkbenchIcon('PanelRight', 'PanelRightFill', !runtime.workbench.state.inspector.collapsed)"
      size="icon-xs"
      variant="ghost"
      @click="toggleInspector"
    />
  </div>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { getComponent } from '@activelane/ui'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchLayoutControls' })

const runtime = useWorkbenchRuntime()

const IconButton = getComponent('icon-button')
const PanelLeft = getIcon('mynaui:panel-left')
const PanelLeftAlt = getIcon('mynaui:panel-left-solid')
const PanelRight = getIcon('mynaui:panel-right')
const PanelRightAlt = getIcon('mynaui:panel-right-solid')
const PanelBottom = getIcon('mynaui:panel-bottom')
const PanelBottomAlt = getIcon('mynaui:panel-bottom-solid')

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
    <IconButton label="Toggle sidebar" size="tiny" @click="toggleSidebar">
      <PanelLeft v-if="runtime.workbench.state.sidebar.collapsed" />
      <PanelLeftAlt v-else />
    </IconButton>
    <IconButton label="Toggle bottom panel" size="tiny" @click="toggleBottomPanel">
      <PanelBottom v-if="runtime.workbench.state.bottomPanel.open" />
      <PanelBottomAlt v-else />
    </IconButton>
    <IconButton label="Toggle inspector" size="tiny" @click="toggleInspector">
      <PanelRight v-if="runtime.workbench.state.inspector.collapsed" />
      <PanelRightAlt v-else />
    </IconButton>
  </div>
</template>

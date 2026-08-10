<script setup lang="ts">
// import { WorkbenchLayoutControls } from '@activelane/workbench'
import { WorkbenchLayoutControls } from '../../../../navigation/window'

defineOptions({ name: 'WorkbenchLayoutControls' })
</script>

<template>
  <!-- <WorkbenchLayoutControls class="workbench-title-bar__layout" data-workbench-no-drag /> -->
  <WorkbenchLayoutControls class="workbench-title-bar__layout" data-workbench-no-drag />
</template>

<style scoped>
.workbench-title-bar__layout {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
  min-width: 0;
}
</style>

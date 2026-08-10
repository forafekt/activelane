<script setup lang="ts">
import { WorkbenchGlobalMenuLauncher } from '../../../../../components/navigation/menus'

// import { WorkbenchGlobalMenuLauncher } from '@activelane/workbench'

defineOptions({ name: 'WorkbenchMenuBar' })
</script>

<template>
  <div class="workbench-title-bar__menus" data-workbench-no-drag>
    <!-- <WorkbenchGlobalMenuLauncher placement="topBar" labels /> -->
    <WorkbenchGlobalMenuLauncher placement="topBar" labels />
  </div>
</template>

<style scoped>
.workbench-title-bar__menus {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.125rem;
  min-width: 0;
  overflow: hidden;
}

.workbench-title-bar__menus :deep(.wb-global-menu-bar__item) {
  min-height: 1.5rem;
  padding: 0 0.375rem;
}
</style>

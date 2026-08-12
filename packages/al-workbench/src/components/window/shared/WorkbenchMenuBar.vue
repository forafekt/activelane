<script setup lang="ts">
import { WorkbenchGlobalMenuLauncher } from '../../navigation/menus'

defineOptions({ name: 'WorkbenchMenuBar' })
</script>

<template>
  <div class="workbench-window-header__menus" data-workbench-no-drag>
    <WorkbenchGlobalMenuLauncher placement="topBar" labels />
  </div>
</template>

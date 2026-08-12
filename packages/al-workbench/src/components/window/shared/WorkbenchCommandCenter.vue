<script setup lang="ts">
import { WorkbenchCommandBar } from '../../navigation/command/WorkbenchCommandPalette'

defineOptions({ name: 'WorkbenchCommandCenter' })
</script>

<template>
  <div class="workbench-window-header__command" data-workbench-no-drag>
    <WorkbenchCommandBar />
  </div>
</template>

<script setup lang="ts">
import { WorkbenchCommandBar } from '../../../../navigation/command/WorkbenchCommandPalette'

defineOptions({ name: 'WorkbenchCommandCenter' })
</script>

<template>
  <div class="workbench-title-bar__command" data-workbench-no-drag>
    <!-- <WorkbenchCommandBar /> -->
    <WorkbenchCommandBar />
  </div>
</template>

<style scoped>
.workbench-title-bar__command {
  flex: 1 1 18rem;
  min-width: 0;
  max-width: 42rem;
  margin-inline: 0.25rem;
}

.workbench-title-bar__command :deep(.wb-command-bar) {
  height: 1.625rem;
}
</style>

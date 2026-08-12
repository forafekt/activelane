<script setup lang="ts">
import WorkbenchTabColorPicker from './WorkbenchTabColorPicker.vue'
import WorkbenchTabProtectionDialog from './WorkbenchTabProtectionDialog.vue'
import WorkbenchTabRenameDialog from './WorkbenchTabRenameDialog.vue'
import WorkbenchTabUnlockDialog from './WorkbenchTabUnlockDialog.vue'

defineOptions({ name: 'WorkbenchTabInteractionDialogs' })
</script>

<template>
  <WorkbenchTabRenameDialog />
  <WorkbenchTabColorPicker />
  <WorkbenchTabProtectionDialog />
  <WorkbenchTabUnlockDialog />
</template>

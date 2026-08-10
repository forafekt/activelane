<script setup lang="ts">
import type { WorkbenchSettingEntry } from '../../settings/types'
import WorkbenchSettingRow from './WorkbenchSettingRow.vue'

defineOptions({ name: 'BooleanSettingRow' })
defineProps<{ setting: WorkbenchSettingEntry }>()
const emit = defineEmits<{ change: [id: string, value: unknown]; reset: [id: string] }>()
function forwardChange(id: string, value: unknown) {
  emit('change', id, value)
}
</script>
<template
  ><WorkbenchSettingRow
    v-bind="$props"
    @change="forwardChange"
    @reset="emit('reset', $event)"
  /></template
>

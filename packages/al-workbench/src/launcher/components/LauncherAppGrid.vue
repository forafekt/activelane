<script setup lang="ts">
import type { WorkbenchApplicationContribution } from '@activelane/workbench-api'
import LauncherAppCard from './LauncherAppCard.vue'

defineOptions({ name: 'LauncherAppGrid' })

defineProps<{
  apps: WorkbenchApplicationContribution[]
  selectedAppId?: string
  pinnedIds?: string[]
  view?: 'grid' | 'list'
}>()

const emit = defineEmits<{
  launch: [appId: string]
  pin: [appId: string]
  unpin: [appId: string]
}>()
</script>

<template>
  <div class="launcher-app-grid" :class="{ 'launcher-app-grid--list': view === 'list' }">
    <LauncherAppCard
      v-for="app in apps"
      :key="app.id"
      :app="app"
      :active="app.id === selectedAppId"
      :pinned="pinnedIds?.includes(app.id)"
      @launch="emit('launch', $event)"
      @pin="emit('pin', $event)"
      @unpin="emit('unpin', $event)"
    />
  </div>
</template>

<style scoped>
.launcher-app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.75rem;
}

.launcher-app-grid--list {
  grid-template-columns: 1fr;
}
</style>

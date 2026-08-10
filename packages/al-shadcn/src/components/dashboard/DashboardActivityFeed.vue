<script setup lang="ts">
import Timeline from '../data-display/Timeline.vue'
import DashboardWidget from './DashboardWidget.vue'

defineOptions({ name: 'AlDashboardActivityFeed' })

defineProps<{
  title?: string
  description?: string
  items?: Array<{ id: string; title: string; description?: string; time?: string }>
}>()
</script>

<template>
  <DashboardWidget :title="title ?? 'Activity'" :description="description">
    <Timeline :items="items ?? []" />
    <slot />
  </DashboardWidget>
</template>

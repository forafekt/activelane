<script setup lang="ts">
import DashboardQuickActions from './DashboardQuickActions.vue'
import type { DashboardActionItem } from './types'

defineOptions({ name: 'AlDashboardAttentionPanel' })

defineProps<{
  title?: string
  description?: string
  items?: DashboardActionItem[]
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <DashboardQuickActions
    :title="title ?? 'Needs attention'"
    :description="description"
    :items="items"
    @select="emit('select', $event)"
  >
    <slot />
  </DashboardQuickActions>
</template>

<script setup lang="ts">
import ActionRow from '../data-display/ActionRow.vue'
import DashboardWidget from './DashboardWidget.vue'
import type { DashboardActionItem } from './types'

defineOptions({ name: 'AlDashboardQuickActions' })

defineProps<{
  title?: string
  description?: string
  items?: DashboardActionItem[]
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <DashboardWidget :title="title ?? 'Quick actions'" :description="description">
    <div class="grid gap-1">
      <ActionRow
        v-for="item in items ?? []"
        :key="item.id"
        compact
        :title="item.title"
        :description="item.description"
        :icon="item.icon"
        @click="emit('select', item.id)"
      />
      <slot />
    </div>
  </DashboardWidget>
</template>

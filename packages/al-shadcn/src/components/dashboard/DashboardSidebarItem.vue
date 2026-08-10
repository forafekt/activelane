<script setup lang="ts">
import type { IconComponent } from '../../types'
import ActionRow from '../data-display/ActionRow.vue'
import Badge from '../ui/Badge.vue'

defineOptions({ name: 'AlDashboardSidebarItem' })

defineProps<{
  label?: string
  title?: string
  description?: string
  badge?: string | number | null
  icon?: IconComponent
  active?: boolean
  compact?: boolean
  class?: string
}>()
</script>

<template>
  <ActionRow
    :title="title ?? label ?? ''"
    :description="description"
    :icon="icon"
    :active="active"
    :compact="compact ?? true"
    :class="$props.class"
  >
    <template v-if="badge !== null && badge !== undefined" #title-suffix>
      <Badge variant="outline">{{ badge }}</Badge>
    </template>
  </ActionRow>
</template>

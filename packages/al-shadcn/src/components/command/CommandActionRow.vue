<script setup lang="ts">
import type { IconComponent } from '../../types'
import ActionRow from '../data-display/ActionRow.vue'
import Kbd from '../ui/Kbd.vue'

defineOptions({ name: 'AlCommandActionRow' })

defineProps<{
  title: string
  description?: string
  icon?: IconComponent
  shortcut?: string
  class?: string
}>()
</script>

<template>
  <ActionRow :title="title" :description="description" :icon="icon" :class="$props.class">
    <template v-if="shortcut" #trailing> <Kbd>{{ shortcut }}</Kbd> </template>
  </ActionRow>
</template>

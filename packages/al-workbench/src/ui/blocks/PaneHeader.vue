<script setup lang="ts">
import { AlPanelHeader } from '@activelane/shadcn'

defineOptions({ name: 'PaneHeader' })

defineProps<{
  title?: string
  description?: string
  sticky?: boolean
}>()
</script>

<template>
  <AlPanelHeader :title="title" :description="description" :sticky="sticky">
    <slot />
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
  </AlPanelHeader>
</template>

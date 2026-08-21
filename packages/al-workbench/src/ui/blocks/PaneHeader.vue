<script setup lang="ts">
import { PanelHeader } from '@activelane/shadcn'

defineOptions({ name: 'PaneHeader' })

defineProps<{
  title?: string
  description?: string
  sticky?: boolean
}>()
</script>

<template>
  <PanelHeader :title="title" :description="description" :sticky="sticky">
    <slot />
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
  </PanelHeader>
</template>

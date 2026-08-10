<script setup lang="ts">
import SectionHeader from '../layout/SectionHeader.vue'

defineOptions({ name: 'AlDashboardPageHeader' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <SectionHeader :title="title" :description="description" :class="$props.class">
    <slot />
    <template v-if="$slots.actions" #actions> <slot name="actions" /> </template>
  </SectionHeader>
</template>

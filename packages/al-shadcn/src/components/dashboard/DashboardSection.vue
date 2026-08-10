<script setup lang="ts">
import Section from '../layout/Section.vue'

defineOptions({ name: 'AlDashboardSection' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <Section :title="title" :description="description" :class="$props.class"> <slot /> </Section>
</template>

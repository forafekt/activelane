<script setup lang="ts">
import { cn } from '../../lib/utils'
import SectionHeader from './SectionHeader.vue'

defineOptions({ name: 'Section' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <section :class="cn('grid gap-3', $props.class)">
    <slot name="header">
      <SectionHeader v-if="title || description" :title="title" :description="description" />
    </slot>
    <slot />
  </section>
</template>

<script setup lang="ts">
import InlineFormRow from './InlineFormRow.vue'

defineOptions({ name: 'AlSettingsRow' })

defineProps<{
  title?: string
  label?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <InlineFormRow :label="title ?? label" :description="description" :class="$props.class">
    <slot />
  </InlineFormRow>
</template>

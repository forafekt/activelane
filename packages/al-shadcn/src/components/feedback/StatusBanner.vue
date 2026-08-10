<script setup lang="ts">
import Alert from './Alert.vue'

defineOptions({ name: 'AlStatusBanner' })

defineProps<{
  title?: string
  description?: string
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info'
  class?: string
}>()
</script>

<template>
  <Alert :title="title" :tone="tone" :class="$props.class"> <slot>{{ description }}</slot> </Alert>
</template>

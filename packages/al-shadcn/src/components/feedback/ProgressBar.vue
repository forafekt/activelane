<script setup lang="ts">
import Progress from '../ui/Progress.vue'

defineOptions({ name: 'AlProgressBar' })

defineProps<{
  value?: number
  max?: number
  class?: string
}>()
</script>

<template>
  <Progress :value="value" :max="max" :class="$props.class" />
</template>

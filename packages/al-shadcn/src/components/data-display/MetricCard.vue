<script setup lang="ts">
import StatBlock from './StatBlock.vue'

defineOptions({ name: 'AlMetricCard' })

defineProps<{
  label?: string
  title?: string
  value: string | number
  delta?: string
  class?: string
}>()
</script>

<template>
  <StatBlock :label="label ?? title ?? ''" :value="value" :delta="delta" :class="$props.class" />
</template>

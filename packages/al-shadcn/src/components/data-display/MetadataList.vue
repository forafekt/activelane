<script setup lang="ts">
import { cn } from '../../lib/utils'
import KeyValueRow from './KeyValueRow.vue'

defineOptions({ name: 'AlMetadataList' })

defineProps<{
  items: Array<{ label: string; value?: string | number | null }>
  class?: string
}>()
</script>

<template>
  <dl :class="cn('grid gap-1', $props.class)">
    <KeyValueRow v-for="item in items" :key="item.label" :label="item.label" :value="item.value" />
  </dl>
</template>

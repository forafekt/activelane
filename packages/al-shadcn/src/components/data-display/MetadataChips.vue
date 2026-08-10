<script setup lang="ts">
import { cn } from '../../lib/utils'
import Badge from '../ui/Badge.vue'

defineOptions({ name: 'AlMetadataChips' })

defineProps<{
  items: Array<{ id: string; label: string; value?: string | number }>
  class?: string
}>()
</script>

<template>
  <div :class="cn('flex min-w-0 flex-wrap items-center gap-1.5', $props.class)">
    <Badge v-for="item in items" :key="item.id" variant="outline">
      <span class="text-muted-foreground">{{ item.label }}</span>
      <span v-if="item.value !== undefined" class="ml-1 text-foreground">{{ item.value }}</span>
    </Badge>
  </div>
</template>

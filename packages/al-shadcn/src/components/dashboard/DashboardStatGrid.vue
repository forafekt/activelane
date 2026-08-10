<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlDashboardStatGrid' })

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', $props.class)"><slot /></div>
</template>

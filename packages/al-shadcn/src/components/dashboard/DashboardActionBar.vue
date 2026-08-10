<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlDashboardActionBar' })

defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="cn('flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-2', $props.class)"
  >
    <slot />
  </div>
</template>

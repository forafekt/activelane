<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlDashboardContent' })

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('mx-auto grid w-full max-w-7xl gap-4 p-4 md:p-6', $props.class)"><slot /></div>
</template>

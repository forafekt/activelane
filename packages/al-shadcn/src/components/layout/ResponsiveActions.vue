<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlResponsiveActions' })

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('flex flex-wrap items-center gap-2', $props.class)"><slot /></div>
</template>

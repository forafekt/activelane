<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlTable' })

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('w-full overflow-auto rounded-lg border border-border', $props.class)">
    <table class="w-full caption-bottom text-sm">
      <slot />
    </table>
  </div>
</template>

<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'xxxAlSidebarRail' })

defineProps<{ class?: string }>()
</script>

<template>
  <nav :class="cn('flex h-full flex-col items-center gap-1 p-2', $props.class)">
    <slot />
  </nav>
</template>

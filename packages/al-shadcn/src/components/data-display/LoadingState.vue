<script setup lang="ts">
import { cn } from '../../lib/utils'
import Skeleton from '../ui/Skeleton.vue'

defineOptions({ name: 'AlLoadingState' })

withDefaults(
  defineProps<{
    rows?: number
    class?: string
  }>(),
  {
    rows: 4,
  },
)
</script>

<template>
  <div :class="cn('grid gap-2', $props.class)" aria-busy="true">
    <Skeleton v-for="index in rows" :key="index" class="h-10 w-full" />
  </div>
</template>

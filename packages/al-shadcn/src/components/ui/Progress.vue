<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { clamp, cn } from '../../lib/utils'

defineOptions({ name: 'Progress' })

withDefaults(
  defineProps<{
    value?: number
    max?: number
    class?: string
  }>(),
  {
    value: 0,
    max: 100,
  },
)
</script>

<template>
  <ProgressRoot
    :model-value="value"
    :max="max"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', $props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-transform duration-300 ease-[var(--ease-emphasized)]"
      :style="{ transform: `translateX(-${100 - clamp((value / max) * 100, 0, 100)}%)` }"
    />
  </ProgressRoot>
</template>

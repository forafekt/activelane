<script setup lang="ts">
import { Separator } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'Separator' })

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    class?: string
  }>(),
  {
    orientation: 'horizontal',
  },
)
</script>

<template>
  <Separator
    :orientation="orientation"
    :class="cn('shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px', $props.class)"
  />
</template>

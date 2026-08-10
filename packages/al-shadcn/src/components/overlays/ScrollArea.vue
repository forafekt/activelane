<script setup lang="ts">
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlScrollArea' })

defineProps<{ class?: string; viewportClass?: string }>()
</script>

<template>
  <ScrollAreaRoot :class="cn('relative overflow-hidden', $props.class)">
    <ScrollAreaViewport
      :inherit-attrs="true"
      :class="cn('size-full rounded-[inherit]', viewportClass)"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      orientation="vertical"
      class="flex touch-none select-none p-0 transition-colors"
    >
      <ScrollAreaThumb class="relative rounded-none border border-6 hover:bg-primary/50" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      orientation="horizontal"
      class="flex touch-none select-none p-0 pt-2 transition-colors"
    >
      <ScrollAreaThumb class="relative rounded-none border border-2 hover:bg-primary/50" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

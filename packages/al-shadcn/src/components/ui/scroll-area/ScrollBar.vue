<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { ScrollAreaScrollbarProps } from 'reka-ui'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }>(),
  {
    orientation: 'vertical',
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const computedClass = computed(() => {
  return cn(
    'flex touch-none select-none p-0 transition-colors',
    props.orientation === 'vertical' && 'h-full w-2 border-l border-l-transparent',
    props.orientation === 'horizontal' && 'h-2 flex-col border-t border-t-transparent',
    props.class,
  )
})
</script>

<template>
  <ScrollAreaScrollbar
    data-slot="scroll-area-scrollbar"
    v-bind="delegatedProps"
    :class="computedClass"
  >
    <ScrollAreaThumb
      class="relative rounded-full bg-border opacity-60 transition-colors hover:bg-muted-foreground"
    />
  </ScrollAreaScrollbar>
</template>

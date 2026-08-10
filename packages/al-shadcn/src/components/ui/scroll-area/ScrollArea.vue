<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { ScrollAreaRootProps } from 'reka-ui'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'
import ScrollBar from './ScrollBar.vue'

const props = defineProps<
  ScrollAreaRootProps & {
    class?: HTMLAttributes['class']
    viewportClass?: HTMLAttributes['class']
    contentClass?: HTMLAttributes['class']
    orientation?: 'vertical' | 'horizontal'
  }
>()

const delegatedProps = reactiveOmit(props, [
  'class',
  'viewportClass',
  'contentClass',
  'orientation',
])

const onWheel = (e: WheelEvent) => {
  if (props.orientation !== 'horizontal') return

  const viewport = e.currentTarget as HTMLElement

  e.preventDefault()
  viewport.scrollLeft += e.deltaY
}
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative overflow-hidden', $props.class)"
    type="hover"
  >
    <ScrollAreaViewport
      @wheel="onWheel"
      data-slot="scroll-area-viewport"
      :class="cn('size-full', viewportClass)"
    >
      <div data-slot="scroll-area-content" :class="cn(contentClass)">
        <slot />
      </div>
    </ScrollAreaViewport>

    <ScrollBar :orientation="$props.orientation" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

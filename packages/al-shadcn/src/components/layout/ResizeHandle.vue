<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlResizeHandle' })

const props = withDefaults(
  defineProps<{
    intersection?:
      | 'bottom-left-corner'
      | 'bottom-right-corner'
      | 'top-left-corner'
      | 'top-right-corner'
      | undefined
    orientation?: 'horizontal' | 'vertical'
    interactive?: boolean
    class?: string
    horizontalWidth?: `w-${number}`
    verticalHeight?: `h-${number}`
    color?: string
    pressed?: boolean
    hovered?: boolean
  }>(),
  {
    orientation: 'horizontal',
    interactive: false,
    horizontalWidth: 'w-0',
    verticalHeight: 'h-0',
    color: undefined,
  },
)

const tagName = computed(() => (props.interactive ? 'button' : 'div'))

const isPressed = ref(props.pressed ?? false)
const isHovered = ref(props.hovered ?? false)

// function handleMouseDown() {
//   isPressed.value = true
// }

// function handleMouseUp() {
//   isPressed.value = false
// }

// function handleMouseEnter() {
//   isHovered.value = true
// }

// function handleMouseLeave() {
//   isHovered.value = false
// }

watch(
  () => props.pressed,
  (newVal) => {
    isPressed.value = newVal
  },
)

watch(
  () => props.hovered,
  (newVal) => {
    isHovered.value = newVal
  },
)

// const orientationComponentClass = computed(() => {
//   if (props.intersection) {
//     const base = 'absolute bottom-0 z-120 w-12 h-12 border-0 padding-0 bg-transparent cursor-move'
//     if (props.intersection === 'bottom-left-corner') {
//       return base + ' left-0'
//     }
//     if (props.intersection === 'bottom-right-corner') {
//       return base + ' right-0'
//     }
//     if (props.intersection === 'top-left-corner') {
//       return base + ' top-0 left-0'
//     }
//     if (props.intersection === 'top-right-corner') {
//       return base + ' top-0 right-0'
//     }
//   }

//   if (props.orientation === 'horizontal') {
//     return `z-11 h-full ${props.horizontalWidth} cursor-col-resize`
//   }

//   return `z-10 ${props.verticalHeight} w-full cursor-row-resize`
// })

// const orientationSpanClass = computed(() => {
//   if (props.intersection) {
//     return `inset-y-0 ${props.intersection.includes('right') ? 'right-0' : 'left-0'} w-px -translate-y-6/2 group-hover:w-[6px]`
//   }

//   return props.orientation === 'horizontal'
//     ? 'inset-y-0 left-1/2 w-px -translate-x-1/2 group-hover:w-[6px]'
//     : 'inset-x-0 top-1/2 h-px -translate-y-1/2 group-hover:h-[6px]'
// })
</script>

<template>
  <component
    :is="tagName"
    :type="tagName === 'button' ? 'button' : undefined"
    :aria-orientation="orientation"
    :class="
      cn(
        'group relative shrink-0 border-0 bg-transparent p-0 m-0 text-border transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        orientation === 'horizontal' ? `z-11 h-full ${props.horizontalWidth} cursor-col-resize` : `z-10 ${props.verticalHeight} w-full cursor-row-resize`,
        isPressed || isHovered ? 'text-primary' : 'hover:text-primary',
        $props.class,
      )
    "
    :aria-pressed="isPressed"
    :aria-hovered="isHovered"
  >
    <span
      aria-hidden="true"
      :class="
        cn(
          'absolute transition-colors',
          orientation === 'horizontal'
            ? 'inset-y-0 left-1/2 w-px -translate-x-1/2 group-hover:w-[6px]'
            : 'inset-x-0 top-1/2 h-px -translate-y-1/2 group-hover:h-[6px]',
          isPressed || isHovered ? 'bg-primary' : 'hover:bg-primary',
          (isPressed || isHovered) ? (orientation === 'horizontal' ? 'w-1.5' : 'h-1.5') : '',
        )
      "
    />
  </component>
</template>

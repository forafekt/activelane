<script setup lang="ts">
import type { ClassValue } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cn } from '../../lib/utils'

defineOptions({ name: 'ScrollArea' })

const props = withDefaults(
  defineProps<{
    orientation?: 'vertical' | 'horizontal'
    class?: ClassValue
    viewportClass?: ClassValue

    // Customization Props for Scrollbar styles
    scrollbarSize?: string
    scrollbarTrackColor?: string
    scrollbarThumbColor?: string
    scrollbarThumbHoverColor?: string
    scrollbarRadius?: string
  }>(),
  {
    scrollbarSize: undefined,
    scrollbarTrackColor: undefined,
    scrollbarThumbColor: undefined,
    scrollbarThumbHoverColor: undefined,
    scrollbarRadius: undefined,
  },
)

const viewportRef = ref<HTMLElement | null>(null)
const detectedOrientation = ref<'vertical' | 'horizontal'>('vertical')
let observer: ResizeObserver | null = null

// Prioritize explicit prop choice over automatic detection
const computedOrientation = computed(() => props.orientation ?? detectedOrientation.value)

// 1. Mouse Wheel Horizontal Scroll Interceptor
const handleWheel = (event: WheelEvent) => {
  if (computedOrientation.value !== 'horizontal' || !viewportRef.value) return

  // If the user is scrolling strictly vertically (deltaY exists but deltaX is 0)
  if (event.deltaY !== 0 && event.deltaX === 0) {
    event.preventDefault() // Block default window/view jumping
    viewportRef.value.scrollLeft += event.deltaY // Map vertical scroll to horizontal scroll
  }
}

// 2. Compute inline style variables for native customization targeting
const scrollbarStyles = computed(() => ({
  '--sb-size': props.scrollbarSize,
  '--sb-track': props.scrollbarTrackColor,
  '--sb-thumb': props.scrollbarThumbColor,
  '--sb-thumb-hover': props.scrollbarThumbHoverColor,
  '--sb-radius': props.scrollbarRadius,
}))

onMounted(() => {
  if (!viewportRef.value) return

  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      detectedOrientation.value = width > height ? 'horizontal' : 'vertical'
    }
  })
  observer.observe(viewportRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    data-slot="scroll-area"
    :class="cn('relative overflow-hidden custom-scrollbar-root', $props.class)"
    :style="scrollbarStyles"
  >
    <div
      ref="viewportRef"
      data-slot="scroll-area-viewport"
      :class="cn(
        'overflow-auto custom-scrollbar-viewport',
        computedOrientation === 'vertical' ? 'h-full overflow-x-hidden' : 'w-full flex overflow-y-hidden', 
        viewportClass
      )"
      @wheel="handleWheel"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Target WebKit engines (Wails Windows WebView2, Wails macOS WebKit, Chrome, Safari) */
.custom-scrollbar-viewport::-webkit-scrollbar {
  width: var(--sb-size);
  height: var(--sb-size);
}

.custom-scrollbar-viewport::-webkit-scrollbar-track {
  background: var(--sb-track);
}

.custom-scrollbar-viewport::-webkit-scrollbar-thumb {
  background: var(--sb-thumb);
  border-radius: var(--sb-radius);
}

.custom-scrollbar-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--sb-thumb-hover);
}

/* Cross-browser Fallback Standard Properties (Firefox and standard compliant browsers) */
@supports (scrollbar-color: auto) {
  .custom-scrollbar-viewport {
    scrollbar-color: var(--sb-thumb) var(--sb-track);
    scrollbar-width: thin;
  }
}
</style>

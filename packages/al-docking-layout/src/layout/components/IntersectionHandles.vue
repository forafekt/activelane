<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useLayout } from '../composables/useLayout'
import { constrainBoundary } from '../core/tree'
import type { SplitNode } from '../core/types'

const props = defineProps<{ parent: SplitNode }>()
const host = ref<HTMLElement>()
const store = useLayout()
const intersections = computed(() =>
  props.parent.children.flatMap((child, childIndex) =>
    child.kind === 'split' && child.direction !== props.parent.direction
      ? child.sizes.slice(0, -1).map((_, nestedIndex) => ({
          child,
          childIndex,
          nestedIndex,
          parentBoundary: childIndex + (childIndex === props.parent.children.length - 1 ? 0 : 1),
        }))
      : [],
  ),
)
function cumulative(values: number[], end: number) {
  return values.slice(0, end).reduce((sum, value) => sum + value, 0)
}
function handleStyle(item: (typeof intersections.value)[number]) {
  const parentAt = cumulative(props.parent.sizes, item.parentBoundary)
  const nestedAt = cumulative(item.child.sizes, item.nestedIndex + 1)
  return props.parent.direction === 'row'
    ? { '--corner-x': `${parentAt}%`, '--corner-y': `${nestedAt}%` }
    : { '--corner-y': `${parentAt}%`, '--corner-x': `${nestedAt}%` }
}
let cleanupActive: (() => void) | undefined
function start(event: PointerEvent, item: (typeof intersections.value)[number]) {
  if (event.button !== 0 || cleanupActive) return
  event.preventDefault()
  event.stopPropagation()
  const element = host.value
  if (!element) return
  const parentRect = element.getBoundingClientRect()
  const childElement = element.parentElement?.querySelector<HTMLElement>(
    `[data-split-id="${CSS.escape(item.child.id)}"]`,
  )
  const childRect = childElement?.getBoundingClientRect()
  if (!childRect) return
  const origin = { x: event.clientX, y: event.clientY }
  const parentSizes = props.parent.sizes.slice()
  const childSizes = item.child.sizes.slice()
  const parentIndex = item.parentBoundary - 1
  const nestedIndex = item.nestedIndex
  const parentSpan = props.parent.direction === 'row' ? parentRect.width : parentRect.height
  const childSpan = item.child.direction === 'row' ? childRect.width : childRect.height
  const parentMin = (index: number) => props.parent.minSizes?.[index] ?? 120
  const parentMax = (index: number) => props.parent.maxSizes?.[index] ?? Infinity
  const childMin = (index: number) => item.child.minSizes?.[index] ?? 120
  const childMax = (index: number) => item.child.maxSizes?.[index] ?? Infinity
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture?.(event.pointerId)
  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return
    const dx = next.clientX - origin.x
    const dy = next.clientY - origin.y
    const parentDelta = ((props.parent.direction === 'row' ? dx : dy) / parentSpan) * 100
    const childDelta = ((item.child.direction === 'row' ? dx : dy) / childSpan) * 100
    const p = constrainBoundary(
      parentSizes,
      parentIndex,
      parentDelta,
      parentSpan,
      parentMin(parentIndex),
      parentMin(parentIndex + 1),
      parentMax(parentIndex),
      parentMax(parentIndex + 1),
    )
    const c = constrainBoundary(
      childSizes,
      nestedIndex,
      childDelta,
      childSpan,
      childMin(nestedIndex),
      childMin(nestedIndex + 1),
      childMax(nestedIndex),
      childMax(nestedIndex + 1),
    )
    store.transaction('resize-intersection', () => {
      store.setSizes(props.parent.id, p)
      store.setSizes(item.child.id, c)
    })
  }
  const cleanup = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', cleanup)
    window.removeEventListener('blur', cleanup)
    handle.removeEventListener('lostpointercapture', cleanup)
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId)
    cleanupActive = undefined
  }
  const up = (next: PointerEvent) => {
    if (next.pointerId === event.pointerId) cleanup()
  }
  cleanupActive = cleanup
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', cleanup)
  window.addEventListener('blur', cleanup)
  handle.addEventListener('lostpointercapture', cleanup)
}
onBeforeUnmount(() => cleanupActive?.())
</script>
<template>
  <div ref="host" class="intersection-layer" aria-hidden="true">
    <button
      type="button"
      v-for="(item, index) in intersections"
      :key="index"
      class="intersection-handle"
      :style="handleStyle(item)"
      tabindex="-1"
      @pointerdown="start($event, item)"
    />
  </div>
</template>

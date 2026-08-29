<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLayout } from '../composables/useLayout'
import { constrainBoundary } from '../core/tree'
import type { SplitNode } from '../core/types'
import IntersectionHandles from './IntersectionHandles.vue'
import LayoutNode from './LayoutNode.vue'

const props = defineProps<{ node: SplitNode }>()
const store = useLayout()
const root = ref<HTMLElement>()
const template = computed(() =>
  props.node.sizes
    .flatMap((size, index) =>
      index < props.node.sizes.length - 1
        ? [`minmax(0, ${size}fr)`, 'var(--dock-handle)']
        : [`minmax(0, ${size}fr)`],
    )
    .join(' '),
)
const style = computed(() =>
  props.node.direction === 'row'
    ? { '--dock-columns': template.value }
    : { '--dock-rows': template.value },
)
function childMin(index: number) {
  const child = props.node.children[index]
  return child.kind === 'group' ? (child.minSize ?? 120) : 120
}
function childMax(index: number) {
  const child = props.node.children[index]
  return child.kind === 'group' ? (child.maxSize ?? Infinity) : Infinity
}

function startResize(event: PointerEvent, index: number) {
  if (event.button !== 0) return
  event.preventDefault()

  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture?.(event.pointerId)

  const start = props.node.sizes.slice()
  const element = root.value

  if (!element) return

  const rect = element.getBoundingClientRect()
  const span = props.node.direction === 'row' ? rect.width : rect.height
  const origin = props.node.direction === 'row' ? event.clientX : event.clientY
  const minA = props.node.minSizes?.[index] ?? childMin(index)
  const minB = props.node.minSizes?.[index + 1] ?? childMin(index + 1)
  const maxA = props.node.maxSizes?.[index] ?? childMax(index)
  const maxB = props.node.maxSizes?.[index + 1] ?? childMax(index + 1)

  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return
    const point = props.node.direction === 'row' ? next.clientX : next.clientY
    store.setSizes(
      props.node.id,
      constrainBoundary(
        start,
        index,
        ((point - origin) / span) * 100,
        span,
        minA,
        minB,
        maxA,
        maxB,
      ),
    )
  }
  const cleanup = () => {
    window.removeEventListener('pointermove', move, true)
    window.removeEventListener('pointerup', up, true)
    window.removeEventListener('pointercancel', cancel, true)
    window.removeEventListener('blur', cancel)
    handle.removeEventListener('lostpointercapture', cancel)
  }

  const up = (next: PointerEvent) => {
    if (next.pointerId === event.pointerId) cleanup()
  }

  const cancel = () => {
    cleanup()
    store.setSizes(props.node.id, start)
  }

  window.addEventListener('pointermove', move, true)
  window.addEventListener('pointerup', up, true)
  window.addEventListener('pointercancel', cancel, true)
  window.addEventListener('blur', cancel)
  handle.addEventListener('lostpointercapture', cancel)
}
function keyResize(event: KeyboardEvent, index: number) {
  const amount = event.shiftKey ? 5 : 1
  const delta =
    event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      ? -amount
      : event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? amount
        : 0
  if (!delta) return
  event.preventDefault()
  const sizes = props.node.sizes.slice()
  sizes[index] += delta
  sizes[index + 1] -= delta
  store.setSizes(props.node.id, sizes)
}
</script>

<template>
  <div class="dock-split-host" :data-split-id="node.id">
    <div ref="root" class="dock-split" :class="`dock-split--${node.direction}`" :style="style">
      <template v-for="(child, index) in node.children" :key="child.id">
        <div class="dock-split__child"><LayoutNode :node="child" /></div>
        <hr
          v-if="index < node.children.length - 1"
          class="dock-resizer"
          :aria-orientation="node.direction === 'row' ? 'vertical' : 'horizontal'"
          :aria-valuenow="Math.round(node.sizes[index])"
          aria-valuemin="0"
          aria-valuemax="100"
          tabindex="0"
          @pointerdown="startResize($event, index)"
          @keydown="keyResize($event, index)"
          @dblclick="store.equalize(node.id)"
        >
      </template>
    </div>
    <IntersectionHandles :parent="node" />
  </div>
</template>

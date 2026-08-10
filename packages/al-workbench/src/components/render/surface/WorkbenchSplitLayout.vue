<script setup lang="ts">
import type { WorkbenchLayoutNode, WorkbenchSplitNode } from '@activelane/workbench-api'
import { computed, ref } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { WorkbenchTabGroup } from '../tabs/main'
import ResizeHandle from './ResizeHandle.vue'

defineOptions({ name: 'WorkbenchSplitLayout' })

const props = defineProps<{
  node: WorkbenchLayoutNode
}>()

const runtime = useWorkbenchRuntime()

// const [AlResizeHandle] = runtime.workbench.ui.getComponents(['AlResizeHandle'])

const hostRef = ref<HTMLElement | null>(null)
const HANDLE_SIZE = 0

const style = computed(() =>
  props.node.kind === 'split'
    ? {
        gridTemplateColumns:
          props.node.orientation === 'horizontal'
            ? props.node.ratios.map((ratio) => `minmax(0, ${ratio}fr)`).join(` ${HANDLE_SIZE}px `)
            : undefined,
        gridTemplateRows:
          props.node.orientation === 'vertical'
            ? props.node.ratios.map((ratio) => `minmax(0, ${ratio}fr)`).join(` ${HANDLE_SIZE}px `)
            : undefined,
      }
    : undefined,
)

function beginResize(event: PointerEvent, split: WorkbenchSplitNode, index: number) {
  const element = hostRef.value
  if (!element) return

  const rect = element.getBoundingClientRect()
  const ratios = split.ratios.slice()
  const startPosition = split.orientation === 'horizontal' ? event.clientX : event.clientY
  const totalSize = Math.max(1, split.orientation === 'horizontal' ? rect.width : rect.height)
  const leftRatio = ratios[index] ?? 0.5
  const rightRatio = ratios[index + 1] ?? 0.5
  const collapseRatio = Math.min(0.18, 72 / totalSize)

  const move = (nextEvent: PointerEvent) => {
    const nextPosition = split.orientation === 'horizontal' ? nextEvent.clientX : nextEvent.clientY
    const deltaRatio = (nextPosition - startPosition) / totalSize
    const normalized = ratios.slice()
    const rawLeft = leftRatio + deltaRatio
    const rawRight = rightRatio - deltaRatio
    const pairTotal = leftRatio + rightRatio

    if (rawLeft <= collapseRatio) {
      normalized[index] = 0
      normalized[index + 1] = pairTotal
    } else if (rawRight <= collapseRatio) {
      normalized[index] = pairTotal
      normalized[index + 1] = 0
    } else {
      normalized[index] = rawLeft
      normalized[index + 1] = rawRight
    }

    runtime.workbench.setSplitRatios(split.id, normalized)
  }

  const end = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    void runtime.workbench.persist()
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
}
</script>

<template>
  <WorkbenchTabGroup v-if="node.kind === 'group'" :group="node" />

  <section v-else ref="hostRef" class="wb-split-layout" :style="style">
    <template v-for="(child, index) in node.children" :key="child.id">
      <WorkbenchSplitLayout
        :node="child"
        :class="node.orientation === 'horizontal' ? 'border-r' : 'border-b'"
      />
      <ResizeHandle
        v-if="index < node.children.length - 1"
        :orientation="node.orientation === 'horizontal' ? 'horizontal' : 'vertical'"
        @pointerdown.prevent="beginResize($event, node, index)"
      />
    </template>
  </section>
</template>
<style scoped>
.wb-split-layout {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>

<script setup lang="ts">
import type { LayoutNode } from '../core/types'
import PaneGroup from './PaneGroup.vue'
import SplitNode from './SplitNode.vue'

defineProps<{ node: LayoutNode }>()
</script>
<template
  ><SplitNode v-if="node.kind === 'split'" :node="node" />
  <PaneGroup v-else :group="node" /></template
>

<script setup lang="ts">
import { cn } from '../../lib/utils'
import PanelHeader from './PanelHeader.vue'

defineOptions({ name: 'AlDetailPanel' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <article
    :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-background', $props.class)"
  >
    <PanelHeader :title="title" :description="description" sticky>
      <template v-if="$slots.actions" #actions> <slot name="actions" /> </template>
    </PanelHeader>
    <div class="min-h-0 overflow-auto"><slot /></div>
  </article>
</template>

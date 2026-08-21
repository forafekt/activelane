<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { Badge, IconButton } from '@activelane/shadcn'
import { ref, watch } from 'vue'

const ChevronDown = getIcon('lucide:chevron-down')
const ChevronRight = getIcon('lucide:chevron-right')

defineOptions({ name: 'PaneSection' })

const props = withDefaults(
  defineProps<{
    title?: string
    count?: number
    collapsible?: boolean
    defaultOpen?: boolean
  }>(),
  { defaultOpen: true },
)

const isOpen = ref(props.defaultOpen)
watch(
  () => props.defaultOpen,
  (value) => {
    isOpen.value = value
  },
)
</script>

<template>
  <section class="min-w-0 border-b border-border/80 last:border-b-0">
    <div
      v-if="title || $slots.heading || $slots.actions"
      class="flex min-h-[var(--workbench-list-row-height)] items-center gap-0.5 px-1.5"
    >
      <IconButton
        v-if="collapsible"
        :label="`${isOpen ? 'Collapse' : 'Expand'} ${title ?? 'section'}`"
        :icon="isOpen ? ChevronDown : ChevronRight"
        @click="isOpen = !isOpen"
      />
      <button
        v-if="title || $slots.heading"
        type="button"
        class="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[0.625rem] font-semibold uppercase tracking-[0.075em] text-muted-foreground"
        @click="collapsible && (isOpen = !isOpen)"
      >
        <slot name="heading">{{ title }}</slot>
        <Badge v-if="count !== undefined" variant="outline">{{ count }}</Badge>
      </button>
      <div v-if="$slots.actions" class="ml-auto flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
    <div v-show="!collapsible || isOpen" class="min-w-0 px-1 pb-1.5"><slot /></div>
  </section>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'

const ChevronRight = getIcon('ChevronRight')

defineOptions({ name: 'AlBreadcrumb' })

defineProps<{
  items: Array<{ id: string; label: string }>
  class?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <nav
    :class="cn('flex min-w-0 items-center gap-1 text-xs text-muted-foreground', $props.class)"
    aria-label="Breadcrumb"
  >
    <template v-for="(item, index) in items" :key="item.id">
      <button
        type="button"
        class="truncate rounded-sm px-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="emit('select', item.id)"
      >
        {{ item.label }}
      </button>
      <ChevronRight v-if="index < items.length - 1" class="size-3 shrink-0" />
    </template>
  </nav>
</template>

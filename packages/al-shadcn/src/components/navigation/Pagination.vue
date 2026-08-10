<script setup lang="ts">
import { getIcons } from '@activelane/icons'
import { cn } from '../../lib/utils'
import Button from '../ui/Button.vue'

const [ChevronLeft, ChevronRight] = getIcons(['ChevronLeft', 'ChevronRight'])

defineOptions({ name: 'AlPagination' })

withDefaults(
  defineProps<{
    page: number
    pageCount: number
    class?: string
  }>(),
  {
    page: 1,
    pageCount: 1,
  },
)

const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>

<template>
  <nav :class="cn('flex items-center gap-2', $props.class)" aria-label="Pagination">
    <Button
      variant="outline"
      size="icon-sm"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
    >
      <ChevronLeft class="size-4" />
    </Button>
    <span class="text-xs text-muted-foreground">Page {{ page }} of {{ pageCount }}</span>
    <Button
      variant="outline"
      size="icon-sm"
      :disabled="page >= pageCount"
      @click="emit('update:page', page + 1)"
    >
      <ChevronRight class="size-4" />
    </Button>
  </nav>
</template>

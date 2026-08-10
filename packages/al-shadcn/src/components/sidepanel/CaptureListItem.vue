<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import Badge from '../ui/Badge.vue'
import IconButton from '../ui/IconButton.vue'

const MoreHorizontal = getIcon('MoreHorizontal')

defineOptions({ name: 'AlCaptureListItem' })

defineProps<{
  title: string
  excerpt?: string
  source?: string
  time?: string
  selected?: boolean
  tags?: string[]
  class?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <article
    :class="
      cn(
        'group grid gap-1 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-muted data-[selected=true]:border-border data-[selected=true]:bg-accent/80',
        $props.class,
      )
    "
    :data-selected="selected ? 'true' : undefined"
  >
    <div class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <h3 class="m-0 line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {{ title }}
        </h3>
        <p
          v-if="excerpt"
          class="m-0 mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
        >
          {{ excerpt }}
        </p>
      </div>
      <IconButton
        label="Open actions"
        size="icon-xs"
        class="opacity-0 group-hover:opacity-100"
        @click.stop="emit('action')"
      >
        <MoreHorizontal class="size-4" />
      </IconButton>
    </div>
    <div class="flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
      <span v-if="source" class="truncate">{{ source }}</span>
      <span v-if="source && time">·</span>
      <time v-if="time">{{ time }}</time>
    </div>
    <div v-if="tags?.length" class="flex flex-wrap gap-1 pt-1">
      <Badge v-for="tag in tags.slice(0, 3)" :key="tag" variant="outline">{{ tag }}</Badge>
    </div>
  </article>
</template>

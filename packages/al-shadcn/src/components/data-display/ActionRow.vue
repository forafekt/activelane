<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import type { IconComponent } from '../../types'

const ChevronRight = getIcon('ChevronRight')

defineOptions({ name: 'AlActionRow' })

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: IconComponent
    active?: boolean
    compact?: boolean
    showArrow?: boolean
    descriptionClass?: string
    class?: string
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <button
    type="button"
    :data-active="active ? 'true' : undefined"
    :class="
      cn(
        'group flex w-full items-center gap-3 rounded-lg border border-transparent text-left transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:border-border data-[active=true]:bg-accent',
        compact ? 'p-2' : 'p-3',
        $props.class,
      )
    "
  >
    <span
      v-if="icon"
      class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
    >
      <component :is="icon" class="size-4" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex min-w-0 items-center gap-2">
        <span class="truncate text-sm font-medium text-foreground">{{ title }}</span>
        <slot name="title-suffix" />
      </span>
      <span
        v-if="description"
        :class="cn('mt-0.5 block text-xs leading-relaxed text-muted-foreground', descriptionClass)"
      >
        {{ description }}
      </span>
      <slot />
    </span>
    <span v-if="$slots.trailing || showArrow" class="ml-auto flex shrink-0 items-center gap-2">
      <slot name="trailing" />
      <ChevronRight v-if="showArrow" class="size-4 text-muted-foreground" />
    </span>
  </button>
</template>

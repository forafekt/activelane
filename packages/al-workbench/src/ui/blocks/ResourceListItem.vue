<script setup lang="ts">
import { AlBadge, AlSelectableItem } from '@activelane/shadcn'
import type { Component } from 'vue'

defineOptions({ name: 'ResourceListItem' })

withDefaults(
  defineProps<{
    title: string
    description?: string
    badge?: string | number
    icon?: Component
    selected?: boolean
    disabled?: boolean
    depth?: number
  }>(),
  { depth: 0 },
)

defineEmits<{ select: [] }>()
</script>

<template>
  <div class="group flex min-w-0 items-center gap-0.5">
    <AlSelectableItem
      dense
      :selected="selected"
      :disabled="disabled"
      :style="{ paddingLeft: `${8 + depth * 14}px` }"
      @click="$emit('select')"
    >
      <component :is="icon" v-if="icon" class="size-3.5 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-[0.6875rem] font-medium">{{ title }}</div>
        <div v-if="description" class="truncate text-[0.625rem] text-muted-foreground">
          {{ description }}
        </div>
      </div>
      <AlBadge v-if="badge !== undefined" variant="outline">{{ badge }}</AlBadge>
      <slot />
    </AlSelectableItem>
    <div
      v-if="$slots.actions"
      class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

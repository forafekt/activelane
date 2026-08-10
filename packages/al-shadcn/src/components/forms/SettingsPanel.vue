<script setup lang="ts">
import { cn } from '../../lib/utils'
import Card from '../ui/Card.vue'

defineOptions({ name: 'AlSettingsPanel' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <Card :class="cn('overflow-hidden p-0', $props.class)">
    <header v-if="title || description || $slots.header" class="border-b border-border px-4 py-3">
      <slot name="header">
        <h2 v-if="title" class="m-0 text-sm font-semibold tracking-tight">{{ title }}</h2>
        <p v-if="description" class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
          {{ description }}
        </p>
      </slot>
    </header>
    <div class="divide-y divide-border px-4"><slot /></div>
  </Card>
</template>

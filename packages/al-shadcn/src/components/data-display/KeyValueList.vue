<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'KeyValueList' })

defineProps<{
  items: Array<{ key: string; label: string; value?: string | number | null }>
  class?: string
}>()
</script>

<template>
  <dl
    :class="cn('grid divide-y divide-border rounded-lg border border-border bg-card', $props.class)"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2 text-sm"
    >
      <dt class="text-muted-foreground">{{ item.label }}</dt>
      <dd class="m-0 min-w-0 truncate text-foreground">{{ item.value ?? '—' }}</dd>
    </div>
  </dl>
</template>

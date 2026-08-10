<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlStatusBar' })

defineProps<{ class?: string }>()
</script>

<template>
  <footer
    :class="cn('flex h-7 items-center justify-between gap-3 border-t border-border bg-surface-2 px-2 text-[0.6875rem] text-muted-foreground', $props.class)"
  >
    <div class="flex min-w-0 items-center gap-2"><slot /></div>
    <div v-if="$slots.trailing" class="flex shrink-0 items-center gap-2">
      <slot name="trailing" />
    </div>
  </footer>
</template>

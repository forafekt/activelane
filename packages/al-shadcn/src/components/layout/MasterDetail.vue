<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlMasterDetail' })

withDefaults(
  defineProps<{
    mode?: 'auto' | 'list' | 'detail'
    listWidth?: string
    class?: string
  }>(),
  {
    mode: 'auto',
    listWidth: '20rem',
  },
)
</script>

<template>
  <section
    :class="
      cn(
        'grid h-full min-h-0 min-w-0 overflow-hidden',
        mode === 'auto' && 'grid-cols-1 md:grid-cols-[var(--al-list-width)_minmax(0,1fr)]',
        mode === 'list' && 'grid-cols-1',
        mode === 'detail' && 'grid-cols-1',
        $props.class,
      )
    "
    :style="{ '--al-list-width': listWidth }"
  >
    <aside
      v-show="mode !== 'detail'"
      class="min-h-0 min-w-0 overflow-hidden border-r border-border bg-surface-1"
    >
      <slot name="list" />
    </aside>
    <main v-show="mode !== 'list'" class="min-h-0 min-w-0 overflow-hidden bg-background">
      <slot name="detail" />
    </main>
  </section>
</template>

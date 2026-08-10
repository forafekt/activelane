<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlAppShell' })

withDefaults(
  defineProps<{
    sidebarOpen?: boolean
    sidebarWidth?: string
    railWidth?: string
    inspectorWidth?: string
    class?: string
  }>(),
  {
    sidebarWidth: '18rem',
    railWidth: '3.25rem',
    inspectorWidth: '20rem',
  },
)

const emit = defineEmits<{ 'update:sidebarOpen': [value: boolean] }>()
</script>

<template>
  <main
    :class="cn('relative grid h-dvh min-h-0 overflow-hidden bg-background text-foreground', $props.class)"
    :style="{ '--al-sidebar-width': sidebarWidth, '--al-rail-width': railWidth, '--al-inspector-width': inspectorWidth }"
  >
    <button
      v-if="$slots.sidebar"
      type="button"
      class="fixed inset-0 z-60 bg-[var(--overlay)] opacity-0 backdrop-blur-[2px] transition-opacity data-[open=true]:opacity-100 lg:hidden"
      :data-open="sidebarOpen ? 'true' : undefined"
      aria-label="Close sidebar"
      @click="emit('update:sidebarOpen', false)"
    />
    <div
      class="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[var(--al-rail-width)_var(--al-sidebar-width)_minmax(0,1fr)]"
    >
      <aside v-if="$slots.rail" class="hidden min-h-0 border-r border-border bg-surface-2 lg:block">
        <slot name="rail" />
      </aside>
      <aside
        v-if="$slots.sidebar"
        class="fixed inset-y-0 left-0 z-70 w-[var(--al-sidebar-width)] -translate-x-full border-r border-border bg-surface-1 shadow-lg transition-transform lg:static lg:z-auto lg:translate-x-0 lg:shadow-none"
        :class="sidebarOpen && 'translate-x-0'"
      >
        <slot name="sidebar" />
      </aside>
      <section class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <header
          v-if="$slots.topbar"
          class="z-50 border-b border-border bg-surface-glass backdrop-blur-xl"
        >
          <slot name="topbar" />
        </header>
        <div class="min-h-0 min-w-0 overflow-hidden"><slot /></div>
      </section>
    </div>
  </main>
</template>

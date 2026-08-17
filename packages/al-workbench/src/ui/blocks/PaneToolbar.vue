<script setup lang="ts">
defineOptions({ name: 'PaneToolbar' })
</script>

<template>
  <div
    class="flex min-h-[var(--workbench-toolbar-height)] items-center gap-1.5 border-b border-border bg-[var(--toolbar-surface,var(--background))] px-2 py-1"
  >
    <div class="min-w-0 flex-1"><slot /></div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>

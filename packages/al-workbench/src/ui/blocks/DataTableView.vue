<script setup lang="ts">
defineOptions({ name: 'DataTableView' })

defineProps<{
  columns: Array<{ key: string; label: string; width?: string }>
}>()
</script>

<template>
  <div class="h-full overflow-auto text-xs">
    <div
      class="sticky top-0 z-10 grid min-h-[var(--workbench-list-row-height)] items-center gap-2 border-b border-border bg-[var(--toolbar-surface,var(--background))] px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.075em] text-muted-foreground"
      :style="{ gridTemplateColumns: columns.map((column) => column.width ?? 'minmax(0, 1fr)').join(' ') }"
    >
      <span v-for="column in columns" :key="column.key">{{ column.label }}</span>
    </div>
    <slot :columns="columns" />
  </div>
</template>

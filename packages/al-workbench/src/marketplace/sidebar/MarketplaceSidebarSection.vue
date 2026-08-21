<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'

defineProps<{ runtime: WorkbenchRuntimeApi; title: string; count?: number; open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <section class="sidebar-section">
    <button
      type="button"
      class="sidebar-section-header"
      :aria-expanded="open"
      @click="emit('toggle')"
    >
      <span class="chevron" :class="{ open }">›</span>
      <strong>{{ title }}</strong>
      <em v-if="count !== undefined">{{ count }}</em>
    </button>
    <div v-if="open" class="sidebar-section-content"><slot /></div>
  </section>
</template>

<style scoped>
.sidebar-section {
  border-bottom: 1px solid var(--border);
}
.sidebar-section-header {
  display: grid;
  width: 100%;
  height: 27px;
  grid-template-columns: 12px 1fr auto;
  align-items: center;
  padding: 0 7px 0 5px;
  border: 0;
  background: var(--toolbar-surface);
  color: var(--text-muted);
  cursor: pointer;
}
.sidebar-section-header:hover {
  background: var(--hover);
  color: var(--foreground);
}
.sidebar-section-header strong {
  font-size: 9px;
  letter-spacing: 0.055em;
  text-align: left;
  text-transform: uppercase;
}
.sidebar-section-header em {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 8px;
  background: var(--pane-inset);
  font-size: 8px;
  font-style: normal;
  text-align: center;
}
.chevron {
  transform: rotate(0);
  font-size: 15px;
  line-height: 1;
  transition: transform 0.1s ease;
}
.chevron.open {
  transform: rotate(90deg);
}
.sidebar-section-content {
  display: grid;
}
</style>

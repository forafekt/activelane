<script setup lang="ts">
defineOptions({ name: 'SurfaceZoneDemoPane' })
</script>

<template>
  <section class="surface-zone-demo">
    <h2>Workbench Zones</h2>
    <p>Status bar, activity rail, bottom pane, menu, and command contributions are active.</p>
  </section>
</template>

<style scoped>
.surface-zone-demo {
  display: grid;
  align-content: start;
  gap: 0.5rem;
  height: 100%;
  padding: 1rem;
  color: var(--foreground);
}

.surface-zone-demo h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.surface-zone-demo p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}
</style>

<script setup lang="ts">
import type { PaneInstance } from '../layout'

defineProps<{ pane: PaneInstance }>()
</script>
<template>
  <div class="demo-inspector">
    <h3>Layout inspector</h3>
    <dl>
      <dt>Pane ID</dt>
      <dd>{{ pane.id }}</dd>
      <dt>Resource</dt>
      <dd>{{ pane.resourceId ?? 'none' }}</dd>
      <dt>Open policy</dt>
      <dd>reuse</dd>
    </dl>
    <h3>Tips</h3>
    <p>Drag tabs to any pane. Drop in the center to merge, or at an edge to split.</p>
    <p>Double-click a divider to equalize its children.</p>
  </div>
</template>

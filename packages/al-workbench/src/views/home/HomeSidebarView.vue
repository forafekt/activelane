<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'

defineOptions({ name: 'WorkbenchHomeSidebarView' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
}>()

function execute(commandId: string) {
  void props.runtime.commands.execute(commandId)
}
</script>

<template>
  <section class="home-sidebar">TODO</section>
</template>

<style scoped>
.home-sidebar {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.home-sidebar__hero {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}

.home-sidebar__eyebrow {
  margin: 0;
  color: #666;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-sidebar__hero h3,
.home-sidebar__hero p {
  margin: 0;
}

.home-sidebar__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.home-sidebar__section {
  display: grid;
  gap: 0.45rem;
}
</style>

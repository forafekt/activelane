<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench-api'

const Home = getIcon('Home')
const Layers3 = getIcon('Layers3')
const Sparkles = getIcon('Sparkles')

defineOptions({ name: 'WorkbenchHomeTabView' })

defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()
</script>

<template>
  <section class="home-tab">TODO</section>
</template>

<style scoped>
.home-tab {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
}

.home-tab__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.home-tab__eyebrow {
  margin: 0 0 0.5rem;
  color: #666;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-tab__header h1,
.home-tab__header p {
  margin: 0;
}

.home-tab__header h1 {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.home-tab__header > p {
  max-width: 32rem;
  color: #666;
  font-size: 0.92rem;
  line-height: 1.55;
}

.home-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.home-card {
  display: grid;
  gap: 0.65rem;
  padding: 1.1rem;
}

.home-card h2,
.home-card p {
  margin: 0;
}

.home-card h2 {
  font-size: 1rem;
}

.home-card__icon {
  width: 18px;
  height: 18px;
  color: #666;
}

.home-card__meta {
  display: flex;
}

@media (max-width: 980px) {
  .home-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-tab__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 680px) {
  .home-overview {
    grid-template-columns: 1fr;
  }
}
</style>

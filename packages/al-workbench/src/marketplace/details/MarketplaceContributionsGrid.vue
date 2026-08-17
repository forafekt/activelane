<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { MarketplaceContributions } from '../types/marketplace'

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  contributions: MarketplaceContributions
}>()
const icons = [
  props.runtime.workbench.ui.getIcon('lucide.layout-grid'),
  props.runtime.workbench.ui.getIcon('lucide.panel-left'),
  props.runtime.workbench.ui.getIcon('lucide.panels-top-left'),
  props.runtime.workbench.ui.getIcon('lucide.panel-right'),
  props.runtime.workbench.ui.getIcon('lucide.panel-bottom'),
  props.runtime.workbench.ui.getIcon('lucide.terminal-square'),
  props.runtime.workbench.ui.getIcon('lucide.menu'),
  props.runtime.workbench.ui.getIcon('lucide.settings-2'),
  props.runtime.workbench.ui.getIcon('lucide.activity'),
  props.runtime.workbench.ui.getIcon('lucide.app-window'),
]
const definitions: Array<{
  key: keyof MarketplaceContributions
  title: string
  description: string
  icon: unknown
}> = [
  {
    key: 'applications',
    title: 'Application launcher',
    description: 'Launches as a first-class ActiveLane application',
    icon: icons[9],
  },
  {
    key: 'activityRail',
    title: 'Activity Rail',
    description: 'Adds a persistent workbench destination',
    icon: icons[0],
  },
  {
    key: 'sidebarViews',
    title: 'Left Sidebar',
    description: 'Provides navigation and contextual tools',
    icon: icons[1],
  },
  {
    key: 'tabSurfaces',
    title: 'Main Workspace',
    description: 'Opens rich application views and editors',
    icon: icons[2],
  },
  {
    key: 'inspectorPanels',
    title: 'Inspector',
    description: 'Adds contextual details to the right pane',
    icon: icons[3],
  },
  {
    key: 'bottomPanels',
    title: 'Bottom Panel',
    description: 'Adds logs, results or background activity',
    icon: icons[4],
  },
  {
    key: 'commands',
    title: 'Commands',
    description: 'Available from menus and the command palette',
    icon: icons[5],
  },
  {
    key: 'menus',
    title: 'Menus',
    description: 'Extends contextual workbench actions',
    icon: icons[6],
  },
  {
    key: 'settingsPages',
    title: 'Settings',
    description: 'Provides dedicated configuration',
    icon: icons[7],
  },
  {
    key: 'statusBar',
    title: 'Status Bar',
    description: 'Shows live status and quick actions',
    icon: icons[8],
  },
]
const visible = computed(() =>
  definitions
    .map((definition) => ({ ...definition, items: props.contributions[definition.key] ?? [] }))
    .filter((item) => item.items.length),
)
</script>

<template>
  <section class="contributions">
    <header>
      <span>Workbench integration</span>
      <h2>Adds to ActiveLane</h2>
      <p>
        These surfaces come directly from the application manifest, so you know where it becomes
        part of your workbench.
      </p>
    </header>
    <div v-if="visible.length" class="contribution-grid">
      <article v-for="item in visible" :key="item.key">
        <div><component :is="item.icon" /></div>
        <section>
          <h3>{{ item.title }}</h3>
          <p>
            {{ item.items.length === 1 ? item.items[0]?.title : `${item.items.length} contributions` }}
          </p>
          <span>{{ item.description }}</span>
        </section>
      </article>
    </div>
    <p v-else class="contribution-empty">
      This extension runs in the background and does not add visible workbench surfaces.
    </p>
  </section>
</template>

<style scoped>
.contributions > header span {
  color: var(--muted-foreground);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.contributions h2 {
  margin: 5px 0 4px;
  font-size: 17px;
}
.contributions > header p {
  max-width: 650px;
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
  line-height: 1.5;
}
.contribution-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.contribution-grid article {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}
.contribution-grid article > div {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 7px;
  background: var(--muted);
}
.contribution-grid svg {
  width: 16px;
  color: var(--muted-foreground);
}
.contribution-grid h3 {
  margin: 0;
  font-size: 11px;
}
.contribution-grid p {
  margin: 2px 0;
  font-size: 10px;
}
.contribution-grid span {
  color: var(--muted-foreground);
  font-size: 9px;
}
.contribution-empty {
  padding: 25px;
  border: 1px dashed var(--border);
  color: var(--muted-foreground);
  font-size: 11px;
  text-align: center;
}
@media (max-width: 800px) {
  .contribution-grid {
    grid-template-columns: 1fr;
  }
}
</style>

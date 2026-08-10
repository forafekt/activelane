<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { ResolvedWorkbenchStatusBarItem } from '../../../core/workbench/zones'
import { resolveStatusBarItems } from '../../../core/workbench/zones'

defineOptions({ name: 'WorkbenchStatusBar' })

const runtime = useWorkbenchRuntime()

const items = computed(() =>
  resolveStatusBarItems(runtime.registry, {
    platform: runtime.host.kind,
    os: 'unknown',
  }).map((item) => {
    const command = item.commandId
      ? runtime.registry.commands.find((candidate) => candidate.id === item.commandId)
      : undefined
    return {
      ...item,
      icon: resolveIcon(item),
      disabled:
        item.enabled === false || (item.commandId ? command?.enabled === false || !command : false),
      tooltip: item.tooltip ?? item.title,
    }
  }),
)

const itemsLeft = computed(() => items.value.filter((item) => item.alignment === 'left'))
const itemsRight = computed(() => items.value.filter((item) => item.alignment === 'right'))

function resolveIcon(item: ResolvedWorkbenchStatusBarItem) {
  if (!item.icon) return undefined
  if (typeof item.icon !== 'string') return item.icon
  try {
    return runtime.workbench.ui.getIcon(item.icon)
  } catch (error) {
    console.warn(`[workbench] Unknown status bar icon "${item.icon}" for "${item.id}".`, error)
    return undefined
  }
}

function activate(item: ResolvedWorkbenchStatusBarItem) {
  if (!item.commandId || item.enabled === false) return
  void runtime.commands.execute(item.commandId)
}
</script>

<template>
  <footer class="wb-status-bar">
    <div class="wb-status-bar__group">
      <div v-for="item in itemsLeft" :key="item.id" class="flex items-center">
        <button
          type="button"
          :disabled="item.disabled"
          :title="item.tooltip"
          class="wb-status-bar__button"
          @click="activate(item)"
        >
          <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
          <span v-if="item.label">{{ item.label }}</span>
        </button>
      </div>
    </div>
    <div class="wb-status-bar__group">
      <div v-for="item in itemsRight" :key="item.id" class="flex items-center">
        <button
          type="button"
          :disabled="item.disabled"
          :title="item.tooltip"
          class="wb-status-bar__button"
          @click="activate(item)"
        >
          <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
          <span v-if="item.label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.wb-status-bar {
  flex: 0 0 1.65rem;
  z-index: 10;
  display: flex;
  width: 100%;
  height: 1.65rem;
  align-items: center;
  justify-content: space-between;
  /* border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent); */
  /* background: var(--shell-chrome-surface); */
  background: var(--workbench-background);
  color: var(--text-muted);
  /* box-shadow: 0 -1px 0 color-mix(in srgb, var(--foreground) 3%, transparent); */
  /* backdrop-filter: blur(14px) saturate(1.06); */
}

.wb-status-bar__group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.wb-status-bar__button {
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  padding: 0.2rem 0.55rem;
  color: inherit;
  font-size: 0.75rem;
}

.wb-status-bar__button:hover {
  background: var(--hover);
  color: var(--text-primary);
}

.wb-status-bar__button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.wb-status-bar__button:disabled {
  cursor: default;
  opacity: 0.5;
}
</style>

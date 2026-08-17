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
          <component v-if="item.icon" :is="item.icon" class="size-3.5" />
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
          <component v-if="item.icon" :is="item.icon" class="size-3.5" />
          <span v-if="item.label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </footer>
</template>

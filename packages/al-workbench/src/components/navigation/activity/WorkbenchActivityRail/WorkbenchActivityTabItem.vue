<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../../../core/workbench/contributions'

defineOptions({ name: 'WorkbenchActivityTabItem' })

const props = defineProps<{
  tab: WorkbenchTab
  active: boolean
  expanded: boolean
}>()

const emit = defineEmits<{
  activate: [tab: WorkbenchTab]
  close: [tab: WorkbenchTab]
}>()

const runtime = useWorkbenchRuntime()
const X = runtime.workbench.ui.getIcon('X')

const favicon = computed(() => {
  const value = props.tab.input?.favicon
  return typeof value === 'string' && value.length > 0 ? value : null
})

const icon = computed(() => {
  if (!props.tab.icon || typeof props.tab.icon !== 'string') return props.tab.icon
  try {
    return runtime.workbench.ui.getIcon(props.tab.icon)
  } catch {
    return runtime.workbench.ui.getIcon('Globe')
  }
})
</script>

<template>
  <div class="wb-activity-tab" :class="{ 'wb-activity-tab--active': active }">
    <button
      type="button"
      class="wb-activity-tab__activate"
      :title="expanded ? undefined : tab.title"
      :aria-label="`Open ${tab.title}`"
      @click="emit('activate', tab)"
    >
      <img v-if="favicon" :src="favicon" alt="" class="wb-activity-tab__favicon">
      <component :is="icon" v-else-if="icon" class="size-4 shrink-0" />
      <span v-else class="wb-activity-tab__fallback">{{ tab.title.slice(0, 1) }}</span>
      <span v-if="expanded" class="wb-activity-tab__label">{{ tab.title }}</span>
    </button>
    <button
      v-if="expanded && tab.closable"
      type="button"
      class="wb-activity-tab__close"
      :aria-label="`Close ${tab.title}`"
      @click.stop="emit('close', tab)"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>

<style scoped>
.wb-activity-tab {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  border-radius: 0.5rem;
  color: var(--text-muted);
}

.wb-activity-tab:hover,
.wb-activity-tab--active {
  background: var(--hover);
  color: var(--text-primary);
}

.wb-activity-tab--active {
  background: var(--selected);
}

.wb-activity-tab--active::before {
  position: absolute;
  inset-block: 0.4rem;
  left: -0.5rem;
  width: 2px;
  border-radius: 999px;
  background: var(--focus-ring);
  content: "";
}

.wb-activity-tab__activate {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 2rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  background: transparent;
  padding: 0.375rem;
  color: inherit;
  cursor: pointer;
}

.wb-activity-tab__label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.wb-activity-tab__favicon,
.wb-activity-tab__fallback {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  border-radius: 0.25rem;
}

.wb-activity-tab__fallback {
  display: grid;
  place-items: center;
  background: var(--pane-surface-raised);
  font-size: 0.625rem;
  font-weight: 600;
}

.wb-activity-tab__close {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: inherit;
  opacity: 0;
  cursor: pointer;
}

.wb-activity-tab:hover .wb-activity-tab__close,
.wb-activity-tab--active .wb-activity-tab__close,
.wb-activity-tab__close:focus-visible {
  opacity: 1;
}

.wb-activity-tab__activate:focus-visible,
.wb-activity-tab__close:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}
</style>

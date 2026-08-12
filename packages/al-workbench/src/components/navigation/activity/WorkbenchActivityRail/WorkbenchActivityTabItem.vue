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

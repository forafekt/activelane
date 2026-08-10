<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import type { WorkbenchTabIndicator as Indicator } from '../../../../core/workbench/tabWorkspace'

defineOptions({ name: 'WorkbenchTabIndicator' })

const props = defineProps<{
  indicator: Indicator
}>()

const runtime = useWorkbenchRuntime()
const Icon = computed(() =>
  props.indicator.icon ? runtime.workbench.ui.getIcon(props.indicator.icon) : undefined,
)
const label = computed(() => props.indicator.tooltip || props.indicator.label)
</script>

<template>
  <button
    v-if="indicator.commandId"
    type="button"
    class="wb-tab-indicator"
    :class="[`wb-tab-indicator--${indicator.severity ?? 'neutral'}`, { 'wb-tab-indicator--pulse': indicator.pulse }]"
    :title="label"
    :aria-label="label"
    @click.stop="runtime.commands.execute(indicator.commandId)"
  >
    <component :is="Icon" v-if="Icon" class="size-3" />
    <span v-else class="wb-tab-indicator__dot" />
    <span v-if="indicator.count != null" class="wb-tab-indicator__count"
      >{{ indicator.count }}</span
    >
  </button>
  <span
    v-else
    class="wb-tab-indicator"
    :class="[`wb-tab-indicator--${indicator.severity ?? 'neutral'}`, { 'wb-tab-indicator--pulse': indicator.pulse }]"
    :title="label"
    :aria-label="label"
    role="img"
  >
    <component :is="Icon" v-if="Icon" class="size-3" />
    <span v-else class="wb-tab-indicator__dot" />
    <span v-if="indicator.count != null" class="wb-tab-indicator__count"
      >{{ indicator.count }}</span
    >
  </span>
</template>

<style scoped>
.wb-tab-indicator {
  display: inline-flex;
  min-width: 0.875rem;
  height: 0.875rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground) 8%, transparent);
  padding: 0 0.125rem;
  color: var(--text-muted);
}

button.wb-tab-indicator {
  cursor: pointer;
}

.wb-tab-indicator--success {
  color: var(--success);
}

.wb-tab-indicator--warning {
  color: var(--warning);
}

.wb-tab-indicator--error {
  color: var(--destructive);
}

.wb-tab-indicator--info {
  color: var(--focus-ring);
}

.wb-tab-indicator__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background: currentColor;
}

.wb-tab-indicator__count {
  max-width: 2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.625rem;
  line-height: 1;
}

.wb-tab-indicator--pulse {
  animation: wb-tab-indicator-pulse 1.4s ease-in-out infinite;
}

@keyframes wb-tab-indicator-pulse {
  50% {
    box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent);
  }
}
</style>

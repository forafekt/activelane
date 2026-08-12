<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchTabIndicator as Indicator } from '../../../core/workbench/tabWorkspace'

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

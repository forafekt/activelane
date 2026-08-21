<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchTabColorId } from '../../../core/workbench/contributions'
import { colorLabel, TAB_COLOR_OPTIONS } from './tabPresentation'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'

defineOptions({ name: 'WorkbenchTabColorPicker' })

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()

const [Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button] =
  runtime.workbench.ui.getComponents([
    'Dialog',
    'DialogContent',
    'DialogDescription',
    'DialogFooter',
    'DialogHeader',
    'DialogTitle',
    'Button',
  ])

const selectedLabel = computed(() => colorLabel(interactions.color.selected))

function swatchClass(color: WorkbenchTabColorId) {
  return `wb-tab-color-swatch wb-tab-color-swatch--${color}`
}
</script>

<template>
  <Dialog :open="interactions.color.open" @update:open="interactions.color.open = $event">
    <DialogContent class="sm:max-w-[25rem]">
      <DialogHeader>
        <DialogTitle>{{ interactions.color.title }}</DialogTitle>
        <DialogDescription>
          Choose a workspace color. Changes preview immediately and are saved with the layout.
        </DialogDescription>
      </DialogHeader>

      <div class="wb-tab-color-preview" :class="swatchClass(interactions.color.selected)">
        <span>{{ selectedLabel }}</span>
      </div>

      <div class="wb-tab-color-grid">
        <button
          v-for="color in TAB_COLOR_OPTIONS"
          :key="color.id"
          type="button"
          class="wb-tab-color-choice"
          :class="{ 'wb-tab-color-choice--selected': color.id === interactions.color.selected }"
          :aria-pressed="color.id === interactions.color.selected"
          @click="interactions.applyColor(color.id)"
        >
          <span :class="swatchClass(color.id)" />
          <span>{{ color.label }}</span>
        </button>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" @click="interactions.applyColor('default')">
          Clear
        </Button>
        <Button type="button" @click="interactions.color.open = false">Done</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.wb-tab-color-preview {
  display: flex;
  align-items: center;
  min-height: 2.5rem;
  border: 1px solid var(--border);
  border-left-width: 0.35rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  padding: 0 0.75rem;
  color: var(--text-primary);
  font-weight: 600;
}

.wb-tab-color-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.wb-tab-color-choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  padding: 0 0.625rem;
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
}

.wb-tab-color-choice:hover,
.wb-tab-color-choice--selected {
  border-color: color-mix(in srgb, var(--focus-ring) 56%, var(--border));
  background: color-mix(in srgb, var(--hover) 76%, transparent);
  color: var(--text-primary);
}

.wb-tab-color-swatch {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--panel);
}

.wb-tab-color-swatch--blue {
  border-color: color-mix(in srgb, var(--focus-ring) 78%, transparent);
  background: color-mix(in srgb, var(--focus-ring) 32%, var(--background));
}

.wb-tab-color-swatch--green {
  border-color: color-mix(in srgb, var(--success) 78%, transparent);
  background: color-mix(in srgb, var(--success) 28%, var(--background));
}

.wb-tab-color-swatch--amber {
  border-color: color-mix(in srgb, var(--warning) 78%, transparent);
  background: color-mix(in srgb, var(--warning) 30%, var(--background));
}

.wb-tab-color-swatch--rose {
  border-color: color-mix(in srgb, var(--destructive) 72%, transparent);
  background: color-mix(in srgb, var(--destructive) 26%, var(--background));
}

.wb-tab-color-swatch--violet {
  border-color: color-mix(in srgb, var(--accent) 72%, var(--focus-ring));
  background: color-mix(in srgb, var(--accent) 32%, var(--background));
}

.wb-tab-color-swatch--slate {
  border-color: color-mix(in srgb, var(--text-muted) 62%, transparent);
  background: color-mix(in srgb, var(--text-muted) 22%, var(--background));
}
</style>

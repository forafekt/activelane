<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { computed, ref } from 'vue'
import { useWorkbenchCommands } from '../../../../composables/useWorkbenchCommands'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import WorkbenchCommandPalette from './WorkbenchCommandPalette.vue'

const Search = getIcon('lucide:search')

defineOptions({ name: 'WorkbenchCommandBar' })

const runtime = useWorkbenchRuntime()
const commands = useWorkbenchCommands()
const launcherRef = ref<HTMLButtonElement | null>(null)

const isOpen = computed(() => runtime.workbench.state.commandPaletteOpen)

function open() {
  commands.open()
}
</script>

<template>
  <button
    ref="launcherRef"
    class="wb-command-bar"
    type="button"
    aria-label="Open command palette"
    :aria-expanded="isOpen"
    @click="open"
  >
    <Search class="size-3.5 text-muted-foreground" />
    <span class="wb-command-bar__placeholder">Search commands</span>
  </button>

  <WorkbenchCommandPalette :anchor-el="launcherRef" />
</template>

<style scoped>
.wb-command-bar {
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
  height: 1.8rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: color-mix(in srgb, var(--surface-raised) 82%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--foreground) 5%, transparent);
  padding: 0 0.5rem;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease;
}

.wb-command-bar:hover,
.wb-command-bar:focus-visible {
  border-color: var(--focus-ring);
  background: var(--surface-overlay);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--focus-ring) 24%, transparent),
    var(--elevation-2);
  outline: 0;
}

.wb-command-bar__placeholder {
  min-width: 0;
  flex: 1;
  padding: 0 0.375rem;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

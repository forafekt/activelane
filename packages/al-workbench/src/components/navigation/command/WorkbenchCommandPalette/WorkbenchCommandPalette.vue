<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useWorkbenchCommands } from '../../../../composables/useWorkbenchCommands'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import WorkbenchCommandBarResults from './WorkbenchCommandBarResults.vue'

defineOptions({ name: 'WorkbenchCommandPalette' })

const props = defineProps<{
  anchorEl: HTMLElement | null
}>()

const runtime = useWorkbenchRuntime()

const ScrollArea = runtime.workbench.ui.getComponent('ScrollArea')
const Search = runtime.workbench.ui.getIcon('Search')

const commands = useWorkbenchCommands()

const query = commands.query
const results = commands.results
const selectedIndex = commands.selectedIndex

const inputRef = ref<HTMLInputElement | null>(null)
const paletteRef = ref<HTMLElement | null>(null)

const x = ref(0)
const y = ref(0)
const width = ref(640)
const hasUserMoved = ref(false)

let dragging = false
let dragStartX = 0
let dragStartY = 0
let startX = 0
let startY = 0

const isOpen = computed(() => runtime.workbench.state.commandPaletteOpen)

function syncToAnchor() {
  if (!props.anchorEl || hasUserMoved.value) return

  const rect = props.anchorEl.getBoundingClientRect()
  const nextWidth = Math.max(rect.width, 560)

  width.value = Math.min(nextWidth, window.innerWidth - 24)
  x.value = Math.min(Math.max(rect.left, 12), window.innerWidth - width.value - 12)
  y.value = Math.min(rect.top, window.innerHeight - 120)
}

watch(isOpen, async (open) => {
  if (!open) return

  hasUserMoved.value = false
  syncToAnchor()

  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
})

watch(
  () => props.anchorEl,
  () => {
    if (isOpen.value) syncToAnchor()
  },
)

function close() {
  commands.close()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    commands.moveSelection(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    commands.moveSelection(-1)
    return
  }

  if (event.key === 'Enter') {
    const selected = results.value[selectedIndex.value]
    if (!selected) return

    event.preventDefault()
    void commands.execute(selected.commandId)
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0) return

  dragging = true
  hasUserMoved.value = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  startX = x.value
  startY = y.value

  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (!dragging) return

  const paletteWidth = paletteRef.value?.offsetWidth ?? width.value
  const paletteHeight = paletteRef.value?.offsetHeight ?? 280

  x.value = Math.min(
    Math.max(startX + event.clientX - dragStartX, 8),
    window.innerWidth - paletteWidth - 8,
  )

  y.value = Math.min(
    Math.max(startY + event.clientY - dragStartY, 8),
    window.innerHeight - paletteHeight - 8,
  )
}

function stopDrag(event: PointerEvent) {
  dragging = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const mod = isMac ? event.metaKey : event.ctrlKey
  const key = event.key.toLowerCase()

  if (mod && (key === 'k' || (event.shiftKey && key === 'p'))) {
    event.preventDefault()
    commands.open()
  }
}

function handleResize() {
  if (isOpen.value && !hasUserMoved.value) syncToAnchor()
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="wb-command-palette-layer" role="presentation" @mousedown.self="close">
      <section
        ref="paletteRef"
        class="wb-command-palette"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        :style="{
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
        }"
      >
        <div
          class="wb-command-palette__input-wrap"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="stopDrag"
          @pointercancel="stopDrag"
        >
          <Search class="size-3.5 text-muted-foreground" />

          <input
            ref="inputRef"
            v-model="query"
            class="wb-command-palette__input"
            type="search"
            autocomplete="off"
            spellcheck="false"
            aria-label="Command or search"
            aria-controls="workbench-command-results"
            :aria-expanded="true"
            placeholder="Search commands"
            @pointerdown.stop
            @keydown="handleKeydown"
          >
        </div>

        <ScrollArea orientation="vertical">
          <WorkbenchCommandBarResults
            id="workbench-command-results"
            :items="results"
            :selected-index="selectedIndex"
            @hover="selectedIndex = $event"
            @select="commands.execute"
          />
        </ScrollArea>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.wb-command-palette-layer {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay, 10000);
  background: transparent;
}

.wb-command-palette {
  position: fixed;
  overflow: hidden;
  max-height: min(34rem, calc(100vh - 1rem));
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-primary);
  box-shadow:
    0 24px 80px rgb(0 0 0 / 55%),
    0 0 0 1px rgb(255 255 255 / 4%);
}

.wb-command-palette__input-wrap {
  display: flex;
  align-items: center;
  height: 2.65rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface-raised);
  padding: 0 0.875rem;
  cursor: grab;
  user-select: none;
}

.wb-command-palette__input-wrap:active {
  cursor: grabbing;
}

.wb-command-palette__input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 0 0.5rem;
  color: var(--text-primary);
  font-size: 0.925rem;
  user-select: text;
}

.wb-command-palette__input::placeholder {
  color: var(--muted-foreground);
}
</style>

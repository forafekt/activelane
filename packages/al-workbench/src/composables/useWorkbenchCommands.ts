import { computed, nextTick, ref, watch } from 'vue'
import type { WorkbenchCommandSearchItem } from '../core/workbench/commands'
import { useWorkbenchRuntime } from './useWorkbenchRuntime'

let sharedState: ReturnType<typeof createWorkbenchCommandsState> | null = null

export function useWorkbenchCommands() {
  if (!sharedState) sharedState = createWorkbenchCommandsState()
  return sharedState
}

function createWorkbenchCommandsState() {
  const runtime = useWorkbenchRuntime()

  const query = ref('')
  const selectedIndex = ref(0)
  const previousFocus = ref<HTMLElement | null>(null)

  const results = computed(() => runtime.commands.search.search(query.value))

  const groupedResults = computed(() => {
    const groups = new Map<string, WorkbenchCommandSearchItem[]>()

    for (const item of results.value) {
      const category = item.category || 'Commands'
      groups.set(category, [...(groups.get(category) ?? []), item])
    }

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }))
  })

  watch(query, () => {
    selectedIndex.value = 0
  })

  watch(results, () => {
    if (!results.value.length) {
      selectedIndex.value = 0
      return
    }

    selectedIndex.value = Math.min(selectedIndex.value, results.value.length - 1)
  })

  function open() {
    if (!runtime.workbench.state.commandPaletteOpen) {
      previousFocus.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    runtime.workbench.setCommandPaletteOpen(true)
    runtime.workbench.setCommandBarFocused(true)
  }

  async function close() {
    runtime.workbench.setCommandPaletteOpen(false)
    runtime.workbench.setCommandBarFocused(false)

    query.value = ''
    selectedIndex.value = 0

    await nextTick()

    previousFocus.value?.focus?.()
    previousFocus.value = null
  }

  async function execute(commandId: string) {
    const executed = await runtime.commands.search.execute(commandId)
    if (!executed) return false

    await close()
    return true
  }

  function moveSelection(delta: 1 | -1) {
    if (!results.value.length) return

    selectedIndex.value =
      (selectedIndex.value + delta + results.value.length) % results.value.length
  }

  return {
    query,
    selectedIndex,
    previousFocus,
    results,
    groupedResults,
    open,
    close,
    execute,
    moveSelection,
  }
}

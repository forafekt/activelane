import { computed } from 'vue'
import { useWorkbenchRuntime } from '../composables/useWorkbenchRuntime'

export function useWorkbenchSettings() {
  const runtime = useWorkbenchRuntime()
  return {
    settings: runtime.settings,
    entries: computed(() => runtime.settings.entries),
    get: runtime.settings.get,
    set: runtime.settings.set,
    reset: runtime.settings.reset,
  }
}

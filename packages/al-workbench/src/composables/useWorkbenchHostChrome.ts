import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'

export function useWorkbenchHostChrome(runtime: WorkbenchRuntimeApi) {
  const desktopChrome = computed(() => runtime.host.kind === 'desktop')

  return {
    desktopChrome,
    showGlobalMenuInActivityLauncher: computed(() => false),
    showGlobalMenuInTopBar: computed(() => desktopChrome.value),
  }
}

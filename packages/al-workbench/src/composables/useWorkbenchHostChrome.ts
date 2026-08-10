import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { computed } from 'vue'

export function useWorkbenchHostChrome(runtime: WorkbenchRuntimeApi) {
  const desktopChrome = computed(() => runtime.host.kind === 'desktop')

  return {
    desktopChrome,
    showGlobalMenuInActivityLauncher: computed(() => false),
    showGlobalMenuInTopBar: computed(() => desktopChrome.value),
  }
}

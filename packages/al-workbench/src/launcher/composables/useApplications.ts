import { computed } from 'vue'
import { useLauncher } from './useLauncher'

export function useApplications() {
  const launcher = useLauncher()
  return {
    apps: computed(() => launcher.getApps()),
    pinnedApps: computed(() => launcher.getPinnedApps()),
    recentApps: computed(() => launcher.getRecentApps()),
    categories: computed(() => launcher.getCategories()),
    results: computed(() => launcher.searchApps(launcher.query)),
    launchApp: launcher.launchApp,
    pinApp: launcher.pinApp,
    unpinApp: launcher.unpinApp,
    isPinned: launcher.isPinned,
  }
}

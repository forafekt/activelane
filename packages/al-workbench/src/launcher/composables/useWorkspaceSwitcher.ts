import { computed } from 'vue'
import { useLauncher } from './useLauncher'

export function useWorkspaceSwitcher() {
  const launcher = useLauncher()
  return {
    workspaces: computed(() => launcher.workspace.workspaces),
    currentWorkspaceId: computed(() => launcher.workspace.currentWorkspaceId),
    currentWorkspace: computed(() => launcher.workspace.getCurrentWorkspace()),
    switchWorkspace: launcher.workspace.switchWorkspace,
    createWorkspace: launcher.workspace.createWorkspace,
  }
}

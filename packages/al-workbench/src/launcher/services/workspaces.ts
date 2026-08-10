import { reactive } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { LauncherWorkspace, LauncherWorkspaceService } from '../types'

const WORKSPACE_STORAGE_KEY = 'workspaces'
const CURRENT_WORKSPACE_STORAGE_KEY = 'current-workspace'

function now() {
  return new Date().toISOString()
}

function createDefaultWorkspace(): LauncherWorkspace {
  const timestamp = now()
  return {
    id: 'default',
    name: 'Main Workspace',
    description: 'Current ActiveLane layout',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createWorkspaceSwitcherService(
  runtime: WorkbenchRuntimeApi,
): LauncherWorkspaceService {
  const storage = runtime.host.capabilities.storage?.scope('workbench.launcher.workspaces')
  const workspaces = reactive<LauncherWorkspace[]>([createDefaultWorkspace()])
  const state = reactive({ currentWorkspaceId: 'default' })

  async function persist() {
    await storage?.set(
      WORKSPACE_STORAGE_KEY,
      workspaces.map((workspace) => ({ ...workspace })),
    )
    await storage?.set(CURRENT_WORKSPACE_STORAGE_KEY, state.currentWorkspaceId)
  }

  void (async () => {
    const persisted = await storage?.get<LauncherWorkspace[]>(WORKSPACE_STORAGE_KEY)
    if (Array.isArray(persisted) && persisted.length) {
      workspaces.splice(0, workspaces.length, ...persisted.filter((item) => item.id && item.name))
    }
    const current = await storage?.get<string>(CURRENT_WORKSPACE_STORAGE_KEY)
    if (current && workspaces.some((workspace) => workspace.id === current)) {
      state.currentWorkspaceId = current
    }
  })()

  return {
    workspaces,
    get currentWorkspaceId() {
      return state.currentWorkspaceId
    },
    getCurrentWorkspace() {
      return workspaces.find((workspace) => workspace.id === state.currentWorkspaceId)
    },
    async switchWorkspace(workspaceId: string) {
      if (!workspaces.some((workspace) => workspace.id === workspaceId)) return
      state.currentWorkspaceId = workspaceId
      await persist()
    },
    async createWorkspace(name?: string) {
      const timestamp = now()
      const workspace: LauncherWorkspace = {
        id: `workspace.${timestamp.replace(/[^0-9]/g, '')}`,
        name: name?.trim() || `Workspace ${workspaces.length + 1}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      workspaces.push(workspace)
      state.currentWorkspaceId = workspace.id
      await persist()
      return workspace
    },
  }
}

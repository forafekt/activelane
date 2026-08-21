import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type { WorkbenchExtensionDefinition } from '../core/extensions/types'
import type { WorkbenchComponent } from '../core/workbench/ui'

import WorkbenchExplorerFileTab from '../explorer/components/WorkbenchExplorerFileTab.vue'
import WorkbenchExplorerView from '../explorer/components/WorkbenchExplorerView.vue'
import { createFilesystemExplorerProvider } from '../explorer/services/filesystemProvider'
import { EXPLORER_FILE_TAB_KIND } from '../explorer/services/openExplorerNode'

const asWorkbenchComponent = (component: unknown) => component as WorkbenchComponent

export function createWorkbenchExplorerContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.workbench-explorer',
      name: 'workbench-explorer',
      displayName: 'Workbench Explorer',
      version: '0.1.0',
      description: 'Provider-based workspace Explorer for ActiveLane.',
      builtin: true,
      activationEvents: ['onStartup'],
      contributes: {
        activityRail: [
          {
            id: 'workbench.explorer',
            title: 'Explorer',
            icon: 'lucide:files',
            defaultSidebarViewId: 'workbench.explorer.view',
            order: 0,
          },
        ],
        sidebarViews: [
          {
            id: 'workbench.explorer.view',
            title: 'Explorer',
            activityId: 'workbench.explorer',
            component: asWorkbenchComponent(WorkbenchExplorerView),
            order: 5,
            actions: [
              {
                id: 'workbench.explorer.refresh.action',
                title: 'Refresh Explorer',
                icon: 'lucide:refresh-cw',
                commandId: 'workbench.explorer.refresh',
              },
              {
                id: 'workbench.explorer.collapseAll.action',
                title: 'Collapse All',
                icon: 'lucide:fold-vertical',
                commandId: 'workbench.explorer.collapseAll',
              },
            ],
          },
        ],
        tabRenderers: [
          {
            id: 'workbench.explorer.file.renderer',
            title: 'File Preview',
            tabKind: EXPLORER_FILE_TAB_KIND,
            component: asWorkbenchComponent(WorkbenchExplorerFileTab),
          },
        ],
        fileOpeners: [
          {
            id: 'workbench.explorer.fileInfo',
            label: 'File Info',
            description: 'Open the ActiveLane file information tab.',
            extensions: ['*'],
            globPatterns: ['*'],
            command: 'workbench.explorer.openFileInfo',
            priority: 1,
          },
        ],
        commands: [
          {
            id: 'workbench.explorer.openFileInfo',
            title: 'Explorer: Open File Info',
            category: 'Explorer',
            icon: 'lucide:info',
            run: ({ runtime }) => {
              const providerId = runtime.explorer.state.selectedProviderId
              const nodeId = runtime.explorer.state.selectedNodeId
              const node =
                providerId && nodeId ? runtime.explorer.getNode(providerId, nodeId) : undefined
              if (node?.uri && node.resourceType === 'file') {
                runtime.workbench.openTab(
                  {
                    id: `file:${node.uri}`,
                    kind: EXPLORER_FILE_TAB_KIND,
                    title: node.label,
                    icon: runtime.workbench.ui.getIcon(node.icon ?? 'lucide:file'),
                    closable: true,
                    preview: true,
                    input: {
                      uri: node.uri,
                      path: node.metadata?.path,
                      resourceType: node.resourceType,
                      modifiedAt: node.metadata?.modifiedAt,
                      size: node.metadata?.size,
                    },
                  },
                  { mode: 'preview', source: 'navigation' },
                )
              }
            },
          },
          {
            id: 'workbench.explorer.refresh',
            title: 'Explorer: Refresh',
            category: 'Explorer',
            icon: 'lucide:refresh-cw',
            run: ({ runtime }) => runtime.explorer.refresh(),
          },
          {
            id: 'workbench.explorer.collapseAll',
            title: 'Explorer: Collapse All',
            category: 'Explorer',
            icon: 'lucide:fold-vertical',
            run: ({ runtime }) => runtime.explorer.collapseAll(),
          },
          {
            id: 'workbench.explorer.copyPath',
            title: 'Explorer: Copy Path',
            category: 'Explorer',
            icon: 'lucide:copy',
            run: ({ runtime }) => {
              const providerId = runtime.explorer.state.selectedProviderId
              const nodeId = runtime.explorer.state.selectedNodeId
              const node =
                providerId && nodeId ? runtime.explorer.getNode(providerId, nodeId) : undefined
              const path = node?.metadata?.path
              if (typeof path === 'string') {
                void runtime.host.capabilities.clipboard?.writeText?.(path)
              }
            },
          },
          {
            id: 'workbench.explorer.revealInFileManager',
            title: 'Explorer: Reveal in File Manager',
            category: 'Explorer',
            icon: 'lucide:external-link',
            run: ({ runtime }) => {
              const providerId = runtime.explorer.state.selectedProviderId
              const nodeId = runtime.explorer.state.selectedNodeId
              const node =
                providerId && nodeId ? runtime.explorer.getNode(providerId, nodeId) : undefined
              const path = node?.metadata?.path
              if (typeof path === 'string') {
                void runtime.host.capabilities.files?.revealInFileManager?.(path)
              }
            },
          },
          {
            id: 'workbench.explorer.newFile',
            title: 'Explorer: New File',
            category: 'Explorer',
            icon: 'lucide:file-plus',
            run: ({ runtime }) => {
              void runtime.host.capabilities.notify?.({
                title: 'New File is not available yet',
                message:
                  'ActiveLane needs a non-browser dialog/input API before file creation is enabled.',
                tone: 'info',
              })
            },
          },
          {
            id: 'workbench.explorer.newFolder',
            title: 'Explorer: New Folder',
            category: 'Explorer',
            icon: 'lucide:folder-plus',
            run: ({ runtime }) => {
              void runtime.host.capabilities.notify?.({
                title: 'New Folder is not available yet',
                message:
                  'ActiveLane needs a non-browser dialog/input API before folder creation is enabled.',
                tone: 'info',
              })
            },
          },
          {
            id: 'workbench.explorer.rename',
            title: 'Explorer: Rename',
            category: 'Explorer',
            icon: 'lucide:pencil',
            run: ({ runtime }) => {
              void runtime.host.capabilities.notify?.({
                title: 'Rename is not available yet',
                message:
                  'ActiveLane needs a non-browser input and confirmation flow before renames are enabled.',
                tone: 'info',
              })
            },
          },
          {
            id: 'workbench.explorer.delete',
            title: 'Explorer: Delete',
            category: 'Explorer',
            icon: 'lucide:trash-2',
            run: ({ runtime }) => {
              void runtime.host.capabilities.notify?.({
                title: 'Delete is not available yet',
                message:
                  'ActiveLane needs a destructive confirmation flow before deletes are enabled.',
                tone: 'warning',
              })
            },
          },
        ],
        commandPalette: [
          {
            id: 'workbench.explorer.refresh.palette',
            title: 'Explorer: Refresh',
            commandId: 'workbench.explorer.refresh',
            category: 'Explorer',
            icon: 'lucide:refresh-cw',
          },
          {
            id: 'workbench.explorer.collapseAll.palette',
            title: 'Explorer: Collapse All',
            commandId: 'workbench.explorer.collapseAll',
            category: 'Explorer',
            icon: 'lucide:fold-vertical',
          },
        ],
        menus: [
          {
            id: 'workbench.explorer.sidebar.refresh',
            title: 'Explorer: Refresh',
            location: 'sidebar/header',
            commandId: 'workbench.explorer.refresh',
            icon: 'lucide:refresh-cw',
            group: 'navigation',
          },
          {
            id: 'workbench.explorer.sidebar.collapseAll',
            title: 'Explorer: Collapse All',
            location: 'sidebar/header',
            commandId: 'workbench.explorer.collapseAll',
            icon: 'lucide:fold-vertical',
            group: 'navigation',
          },
        ],
      },
    },
    activate({ runtime }) {
      return runtime.explorer.registerProvider(createFilesystemExplorerProvider(runtime))
    },
  })
}

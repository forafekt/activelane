import {
  createFileOpenIntent,
  type ExplorerNode,
  type FileOpenIntent,
  type WorkbenchRuntimeApi,
} from '@activelane/workbench-api'

export const EXPLORER_FILE_TAB_KIND = 'workbench.explorer.file'

export interface OpenExplorerNodeOptions {
  forceFileInfo?: boolean
  forceOpenWith?: boolean
  onOpenWith?: (intent: FileOpenIntent) => void
}

export async function openExplorerNode(
  runtime: WorkbenchRuntimeApi,
  node: ExplorerNode,
  options: OpenExplorerNodeOptions = {},
) {
  if (node.disabled) return
  if (!node.isLeaf && node.collapsible !== false) {
    void runtime.explorer.toggle(node)
    return
  }
  if (node.uri && node.resourceType === 'file') {
    const filePath = String(node.metadata?.path ?? node.uri)
    const intent = createFileOpenIntent({
      filePath,
      fileName: node.label,
      isDirectory: false,
    })
    if (options.forceOpenWith) {
      options.onOpenWith?.(intent)
      return
    }
    if (!options.forceFileInfo) {
      const preferred = await runtime.fileOpeners.getPreferred(intent)
      const resolved = runtime.fileOpeners.resolve(intent)
      if (!preferred && resolved.length > 1) {
        options.onOpenWith?.(intent)
        return
      }
      const result = await runtime.fileOpeners.open(intent, preferred)
      if (result === 'opened') return
      if (result === 'unavailable') {
        void runtime.host.capabilities.notify?.({
          title: 'File opener is unavailable',
          message: 'Native file opening is only available in the desktop app.',
          tone: 'warning',
        })
      }
    }
    openExplorerFileInfo(runtime, node)
    return
  }
  void runtime.host.capabilities.notify?.({
    title: 'Explorer item selected',
    message: `${node.label} does not have an opener yet.`,
    tone: 'info',
  })
}

export function openExplorerFileInfo(runtime: WorkbenchRuntimeApi, node: ExplorerNode) {
  runtime.workbench.openTab(
    {
      id: `file:${node.uri}`,
      kind: EXPLORER_FILE_TAB_KIND,
      title: node.label,
      icon: runtime.workbench.ui.getIcon(node.icon ?? 'File'),
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

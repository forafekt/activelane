import type {
  ExplorerNode,
  ExplorerProvider,
  WorkbenchFileSystemEntry,
  WorkbenchRuntimeApi,
} from '@activelane/workbench-api'

const FILE_PROVIDER_ID = 'workbench.files'
const DEFAULT_EXCLUDES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  '.vite',
  '.pnpm-store',
  'coverage',
  '.next',
  '.nuxt',
  '.output',
  '.cache',
  'out',
  'tmp',
  '.DS_Store',
])

export interface FilesystemExplorerProviderOptions {
  showExcluded?: boolean
  showHidden?: boolean
  excludes?: Iterable<string>
}

function fileIcon(name: string) {
  if (name === 'package.json') return 'Package'
  if (name.endsWith('.vue')) return 'Component'
  if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js')) return 'FileCode2'
  if (name.endsWith('.json')) return 'Braces'
  if (name.endsWith('.md')) return 'BookOpenText'
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'Palette'
  return 'File'
}

function nodeFromEntry(entry: WorkbenchFileSystemEntry): ExplorerNode {
  const directory = entry.type === 'directory'
  return {
    id: entry.path,
    label: entry.name,
    icon: directory ? 'Folder' : fileIcon(entry.name),
    uri: entry.uri,
    resourceType: entry.type,
    contextValue: directory ? 'folder' : 'file',
    collapsible: directory,
    isLeaf: !directory,
    tooltip: entry.path,
    description: entry.type === 'symlink' ? 'link' : undefined,
    metadata: {
      path: entry.path,
      type: entry.type,
      size: entry.size,
      modifiedAt: entry.modifiedAt,
      hidden: entry.hidden,
    },
  }
}

export function createFilesystemExplorerProvider(
  runtime: WorkbenchRuntimeApi,
  providerOptions: FilesystemExplorerProviderOptions = {},
): ExplorerProvider {
  const files = runtime.host.capabilities.files
  const options = {
    showExcluded: providerOptions.showExcluded ?? false,
    showHidden: providerOptions.showHidden ?? true,
    excludes: providerOptions.excludes ?? DEFAULT_EXCLUDES,
  } satisfies FilesystemExplorerProviderOptions

  return {
    id: FILE_PROVIDER_ID,
    title: 'Files',
    icon: 'FolderTree',
    order: 10,
    async getChildren(node?: ExplorerNode) {
      if (!files?.readDirectory) {
        return [
          {
            id: 'workbench.files.unavailable',
            label: 'Filesystem unavailable',
            icon: 'CircleSlash',
            description: runtime.host.kind,
            isLeaf: true,
            disabled: true,
            tooltip: 'This host does not expose workspace filesystem browsing.',
          },
        ]
      }
      const targetPath = node?.metadata?.path
      const entries = await files.readDirectory(
        typeof targetPath === 'string' ? targetPath : undefined,
      )
      const excludes = new Set(options.excludes)
      return entries
        .filter((entry) => options.showExcluded || !excludes.has(entry.name))
        .filter((entry) => options.showHidden || !entry.hidden)
        .map(nodeFromEntry)
    },
  }
}

export function isFilesystemNode(node: ExplorerNode | undefined) {
  return node?.providerId === FILE_PROVIDER_ID
}

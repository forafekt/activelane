import type { Disposable } from '../shared/types'
import type { WorkbenchComponent } from './ui'

export interface FileOpenIntent {
  filePath: string
  fileName: string
  extension?: string
  mimeType?: string
  languageId?: string
  isDirectory?: boolean
}

export interface FileOpenerContribution {
  id: string
  label: string
  title?: string
  description?: string
  icon?: WorkbenchComponent | string
  extensions?: string[]
  mimeTypes?: string[]
  languages?: string[]
  globPatterns?: string[]
  priority?: number
  command: string
  ownerExtensionId?: string
  order?: number
}

export interface ResolvedFileOpener {
  id: string
  label: string
  description?: string
  icon?: WorkbenchComponent | string
  source: 'builtin' | 'system' | 'extension'
  extensionId?: string
  command?: string
  executablePath?: string
  appId?: string
  priority: number
  recommended: boolean
}

export interface FileOpenerService {
  register: (
    opener: FileOpenerContribution,
    options?: { source?: 'builtin' | 'extension'; extensionId?: string },
  ) => Disposable
  list: () => FileOpenerContribution[]
  resolve: (intent: FileOpenIntent) => ResolvedFileOpener[]
  getPreferred: (intent: FileOpenIntent) => Promise<string | undefined>
  setPreferred: (intent: FileOpenIntent, openerId: string | undefined) => Promise<void>
  open: (
    intent: FileOpenIntent,
    openerId?: string,
  ) => Promise<'opened' | 'fallback' | 'unavailable'>
}

export interface FileOpenerResolutionOptions {
  systemOpeners?: ResolvedFileOpener[]
  preferredOpenerId?: string
}

interface RankedContribution {
  contribution: FileOpenerContribution
  source: 'builtin' | 'extension'
  extensionId?: string
  score: number
}

export function getFileExtension(fileNameOrPath: string) {
  const fileName = fileNameOrPath.split(/[\\/]/).pop() ?? fileNameOrPath
  const index = fileName.lastIndexOf('.')
  if (index <= 0 || index === fileName.length - 1) return undefined
  return fileName.slice(index + 1).toLowerCase()
}

export function createFileOpenIntent(input: {
  filePath: string
  fileName?: string
  mimeType?: string
  languageId?: string
  isDirectory?: boolean
}): FileOpenIntent {
  const fileName = input.fileName ?? input.filePath.split(/[\\/]/).pop() ?? input.filePath
  return {
    filePath: input.filePath,
    fileName,
    extension: getFileExtension(fileName),
    mimeType: input.mimeType,
    languageId: input.languageId,
    isDirectory: input.isDirectory,
  }
}

export function preferenceKeyForFileOpenIntent(intent: FileOpenIntent) {
  if (intent.extension) return `extension:${intent.extension.toLowerCase()}`
  if (intent.mimeType) return `mime:${intent.mimeType.toLowerCase()}`
  if (intent.languageId) return `language:${intent.languageId.toLowerCase()}`
  return undefined
}

export function resolveFileOpeners(
  intent: FileOpenIntent,
  contributions: FileOpenerContribution[],
  options: FileOpenerResolutionOptions = {},
): ResolvedFileOpener[] {
  if (intent.isDirectory) return []

  const ranked = contributions
    .map((contribution) => rankContribution(intent, contribution))
    .filter((item): item is RankedContribution => Boolean(item))
    .map(({ contribution, source, extensionId, score }) => ({
      id: contribution.id,
      label: contribution.label || contribution.title || contribution.id,
      description: contribution.description,
      icon: contribution.icon,
      source,
      extensionId,
      command: contribution.command,
      priority: (contribution.priority ?? 0) + score,
      recommended: false,
    }))

  const systemOpeners = (options.systemOpeners ?? []).map((opener) => ({
    ...opener,
    recommended: false,
  }))

  const byId = new Map<string, ResolvedFileOpener>()
  for (const opener of [...ranked, ...systemOpeners]) {
    const existing = byId.get(opener.id)
    if (!existing || opener.priority > existing.priority) byId.set(opener.id, opener)
  }

  const resolved = Array.from(byId.values()).sort((left, right) => {
    if (left.id === options.preferredOpenerId) return -1
    if (right.id === options.preferredOpenerId) return 1
    return right.priority - left.priority || left.label.localeCompare(right.label)
  })
  if (resolved[0]) resolved[0].recommended = true
  return resolved
}

function rankContribution(
  intent: FileOpenIntent,
  contribution: FileOpenerContribution,
): RankedContribution | undefined {
  let score = 0
  const extension = intent.extension?.toLowerCase()
  if (
    extension &&
    contribution.extensions?.some((item) => normalizeExtension(item) === extension)
  ) {
    score = Math.max(score, 1000)
  }
  if (
    intent.mimeType &&
    contribution.mimeTypes?.some((item) => item.toLowerCase() === intent.mimeType?.toLowerCase())
  ) {
    score = Math.max(score, 900)
  }
  if (
    intent.languageId &&
    contribution.languages?.some((item) => item.toLowerCase() === intent.languageId?.toLowerCase())
  ) {
    score = Math.max(score, 800)
  }
  if (contribution.globPatterns?.some((pattern) => globMatch(pattern, intent.fileName))) {
    score = Math.max(score, 700)
  }
  if (score <= 0) return undefined
  return {
    contribution,
    source:
      contribution.ownerExtensionId && !contribution.ownerExtensionId.startsWith('activelane.')
        ? 'extension'
        : 'builtin',
    extensionId: contribution.ownerExtensionId,
    score,
  }
}

function normalizeExtension(value: string) {
  return value.trim().replace(/^\./, '').toLowerCase()
}

function globMatch(pattern: string, fileName: string) {
  const escaped = pattern
    .trim()
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i').test(fileName)
}

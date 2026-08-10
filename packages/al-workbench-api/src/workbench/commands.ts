import type {
  WorkbenchCommandContribution,
  WorkbenchCommandPaletteContribution,
} from './contributions'
import type { WorkbenchRegisteredContributions } from './shell'

export interface WorkbenchCommandSearchItem {
  id: string
  commandId: string
  title: string
  description?: string
  category: string
  keywords: string[]
  icon?: WorkbenchCommandContribution['icon']
  shortcut?: string | string[]
  disabled: boolean
  hidden: boolean
  score: number
  ownerExtensionId?: string
  command: WorkbenchCommandContribution
  palette?: WorkbenchCommandPaletteContribution
}

export interface WorkbenchCommandSearchOptions {
  query?: string
  includeDisabled?: boolean
  includeHidden?: boolean
  limit?: number
}

export interface WorkbenchCommandSearchService {
  list: (options?: WorkbenchCommandSearchOptions) => WorkbenchCommandSearchItem[]
  search: (
    query: string,
    options?: Omit<WorkbenchCommandSearchOptions, 'query'>,
  ) => WorkbenchCommandSearchItem[]
  get: (commandId: string) => WorkbenchCommandSearchItem | undefined
  execute: (commandId: string) => Promise<boolean>
  getRecent: () => WorkbenchCommandSearchItem[]
}

export interface WorkbenchCommandSearchDependencies {
  registry: WorkbenchRegisteredContributions
  settings?: {
    get: <T = unknown>(id: string, fallback?: T) => T | undefined
  }
  extensions?: {
    getRecord: (
      extensionId: string,
    ) => { manifest: { displayName?: string }; enabled?: boolean } | undefined
  }
  execute: (commandId: string) => Promise<void>
  recentLimit?: number
}

function tokenize(value: string) {
  return value.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function fuzzyScore(candidate: string, query: string) {
  if (!query) return 0
  const text = candidate.toLowerCase()
  const term = query.toLowerCase()
  const exactIndex = text.indexOf(term)
  if (exactIndex >= 0) return 1000 - exactIndex

  let score = 0
  let cursor = 0
  for (const character of term) {
    const index = text.indexOf(character, cursor)
    if (index < 0) return -1
    score += Math.max(1, 32 - (index - cursor))
    cursor = index + 1
  }
  return score
}

function commandShortcuts(
  command: WorkbenchCommandContribution,
  settings?: WorkbenchCommandSearchDependencies['settings'],
) {
  const override = settings?.get<string>(`keybindings.${command.id}`)
  return [override ?? command.shortcut, ...(command.secondaryShortcuts ?? [])].filter(
    (shortcut): shortcut is string => Boolean(shortcut),
  )
}

function isVisible(
  command: WorkbenchCommandContribution,
  palette?: WorkbenchCommandPaletteContribution,
) {
  return (
    command.visible !== false &&
    palette?.visible !== false &&
    command.when !== 'false' &&
    palette?.when !== 'false'
  )
}

function isEnabled(
  command: WorkbenchCommandContribution,
  palette?: WorkbenchCommandPaletteContribution,
) {
  return command.enabled !== false && palette?.enabled !== false && Boolean(command.run)
}

function searchHaystack(item: WorkbenchCommandSearchItem) {
  return [
    item.title,
    item.command.title,
    item.description,
    item.category,
    item.command.id,
    item.command.shortcut,
    ...(item.command.secondaryShortcuts ?? []),
    ...item.keywords,
  ]
    .filter(Boolean)
    .join(' ')
}

export function createCommandSearchService(
  dependencies: WorkbenchCommandSearchDependencies,
): WorkbenchCommandSearchService {
  const recentCommandIds: string[] = []
  const recentLimit = dependencies.recentLimit ?? 20

  function ownerLabel(ownerExtensionId?: string) {
    if (!ownerExtensionId) return 'Commands'
    return dependencies.extensions?.getRecord(ownerExtensionId)?.manifest.displayName ?? 'Commands'
  }

  function toItem(
    command: WorkbenchCommandContribution,
    palette?: WorkbenchCommandPaletteContribution,
  ): WorkbenchCommandSearchItem {
    const shortcuts = commandShortcuts(command, dependencies.settings)
    const category = palette?.category ?? command.category ?? ownerLabel(command.ownerExtensionId)
    return {
      id: palette?.id ?? `command:${command.id}`,
      commandId: command.id,
      title: palette?.title ?? command.title,
      description: palette?.description,
      category,
      keywords: palette?.keywords ?? [],
      icon: palette?.icon ?? command.icon,
      shortcut: shortcuts.length > 1 ? shortcuts : shortcuts[0],
      disabled: !isEnabled(command, palette),
      hidden: !isVisible(command, palette),
      score: 0,
      ownerExtensionId: command.ownerExtensionId ?? palette?.ownerExtensionId,
      command,
      palette,
    }
  }

  function sourceItems() {
    const byCommandId = new Map<string, WorkbenchCommandSearchItem>()
    const commandById = new Map(
      dependencies.registry.commands.map((command) => [command.id, command]),
    )

    for (const palette of dependencies.registry.commandPalette) {
      const command = commandById.get(palette.commandId)
      if (!command) continue
      if (!byCommandId.has(command.id)) byCommandId.set(command.id, toItem(command, palette))
    }

    for (const menu of dependencies.registry.menus) {
      if (menu.location !== 'command-palette' || !menu.commandId) continue
      const command = commandById.get(menu.commandId)
      if (!command || byCommandId.has(command.id)) continue
      byCommandId.set(
        command.id,
        toItem(command, {
          id: menu.id,
          title: menu.title,
          commandId: menu.commandId,
          category: menu.group,
          icon: typeof menu.icon === 'string' ? undefined : menu.icon,
          order: menu.order,
          when: menu.when,
          enabled: menu.enablement === 'false' ? false : undefined,
          ownerExtensionId: menu.ownerExtensionId,
        }),
      )
    }

    for (const command of dependencies.registry.commands) {
      if (!byCommandId.has(command.id)) byCommandId.set(command.id, toItem(command))
    }

    return Array.from(byCommandId.values()).sort((left, right) => {
      const leftOrder = left.palette?.order ?? left.command.order ?? 0
      const rightOrder = right.palette?.order ?? right.command.order ?? 0
      return leftOrder - rightOrder || left.title.localeCompare(right.title)
    })
  }

  function list(options: WorkbenchCommandSearchOptions = {}) {
    const terms = tokenize(options.query ?? '')
    const recentRank = new Map(recentCommandIds.map((commandId, index) => [commandId, index]))

    const results = sourceItems()
      .filter((item) => options.includeHidden || !item.hidden)
      .filter((item) => options.includeDisabled || !item.disabled)
      .map((item) => {
        if (!terms.length) {
          return {
            ...item,
            score: item.commandId ? 100 - (recentRank.get(item.commandId) ?? 100) : 0,
          }
        }
        const haystack = searchHaystack(item)
        const termScores = terms.map((term) => fuzzyScore(haystack, term))
        const matched = termScores.every((score) => score >= 0)
        return {
          ...item,
          score: matched ? termScores.reduce((total, score) => total + score, 0) : -1,
        }
      })
      .filter((item) => !terms.length || item.score >= 0)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))

    return typeof options.limit === 'number' ? results.slice(0, options.limit) : results
  }

  async function execute(commandId: string) {
    const item = list({ includeDisabled: true }).find((entry) => entry.commandId === commandId)
    if (!item || item.disabled) return false
    await dependencies.execute(commandId)
    recentCommandIds.unshift(commandId)
    const deduped = Array.from(new Set(recentCommandIds)).slice(0, recentLimit)
    recentCommandIds.splice(0, recentCommandIds.length, ...deduped)
    return true
  }

  return {
    list,
    search(query, options) {
      return list({ ...options, query })
    },
    get(commandId) {
      return list({ includeDisabled: true }).find((item) => item.commandId === commandId)
    },
    execute,
    getRecent() {
      return recentCommandIds
        .map((commandId) =>
          list({ includeDisabled: true }).find((item) => item.commandId === commandId),
        )
        .filter((item): item is WorkbenchCommandSearchItem => Boolean(item))
    },
  }
}

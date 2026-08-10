import { computed, ref } from 'vue'
import type { WorkbenchSettingEntry } from '../settings/types'
import { useWorkbenchRuntime } from './useWorkbenchRuntime'

export function useWorkbenchSettingsViewModel() {
  const runtime = useWorkbenchRuntime()
  const activeSettingsTab = runtime.workbench.getActiveTab()
  const query = ref(
    typeof activeSettingsTab?.input?.query === 'string' ? activeSettingsTab.input.query : '',
  )
  const activeCategory = ref(
    typeof activeSettingsTab?.input?.category === 'string'
      ? activeSettingsTab.input.category
      : 'all',
  )
  const showModified = ref(false)
  const showExtensionSettings = ref(activeSettingsTab?.input?.extensionSettings === true)
  const importDraft = ref('')
  const importMessage = ref('')
  const exportDraft = ref('')
  const editingCommandId = ref<string | null>(null)
  const keybindingDraft = ref('')

  const categories = computed(() => {
    const core = new Map<string, number>()
    const extensions = new Map<string, { label: string; count: number }>()

    for (const entry of runtime.settings.entries) {
      if (entry.ownerExtensionId && entry.ownerExtensionId !== 'activelane.workbench-core') {
        const existing = extensions.get(entry.ownerExtensionId)
        extensions.set(entry.ownerExtensionId, {
          label: entry.ownerExtensionName ?? entry.ownerExtensionId,
          count: (existing?.count ?? 0) + 1,
        })
        continue
      }
      core.set(entry.category, (core.get(entry.category) ?? 0) + 1)
    }

    return [
      { id: 'all', label: 'All Settings', count: runtime.settings.entries.length },
      ...Array.from(core.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([label, count]) => ({ id: `category:${label}`, label, count })),
      {
        id: 'extensions',
        label: 'Extensions',
        count: Array.from(extensions.values()).reduce((sum, item) => sum + item.count, 0),
      },
      ...Array.from(extensions.entries())
        .sort(([, left], [, right]) => left.label.localeCompare(right.label))
        .map(([extensionId, item]) => ({
          id: `extension:${extensionId}`,
          label: item.label,
          count: item.count,
        })),
      { id: 'commands', label: 'Commands', count: runtime.registry.commands.length },
      { id: 'keybindings', label: 'Keyboard Shortcuts', count: runtime.registry.commands.length },
    ]
  })

  const normalizedQuery = computed(() => query.value.trim().toLowerCase())

  const baseSettings = computed(() => {
    const terms = normalizedQuery.value.split(/\s+/).filter(Boolean)
    return runtime.settings.entries.filter((entry) => {
      if (showModified.value && !entry.modified) return false
      if (showExtensionSettings.value && !entry.ownerExtensionId) return false
      if (activeCategory.value === 'extensions') {
        if (entry.category !== 'Extensions' && !entry.ownerExtensionId) return false
      } else if (activeCategory.value.startsWith('extension:')) {
        if (entry.ownerExtensionId !== activeCategory.value.slice('extension:'.length)) return false
      } else if (activeCategory.value.startsWith('category:')) {
        if (entry.category !== activeCategory.value.slice('category:'.length)) return false
      }
      if (!terms.length) return true
      return terms.every((term) => searchableText(entry).includes(term))
    })
  })

  const groupedSettings = computed(() => {
    const groups = new Map<string, WorkbenchSettingEntry[]>()
    for (const entry of baseSettings.value) {
      const key = entry.ownerExtensionId
        ? `Extension Settings: ${entry.ownerExtensionName ?? entry.ownerExtensionId}`
        : (entry.subcategory ?? entry.category)
      groups.set(key, [...(groups.get(key) ?? []), entry])
    }
    return Array.from(groups.entries()).map(([title, settings]) => ({ title, settings }))
  })

  const activeCategoryLabel = computed(() => {
    return (
      categories.value.find((category) => category.id === activeCategory.value)?.label ?? 'Settings'
    )
  })

  const commandRows = computed(() => {
    const terms = normalizedQuery.value.split(/\s+/).filter(Boolean)
    return runtime.registry.commands
      .map((command) => {
        const defaultShortcut = command.shortcut ?? ''
        const userShortcut =
          runtime.settings.get<string>(`keybindings.${command.id}`) ?? defaultShortcut
        const source = userShortcut === defaultShortcut ? 'default' : 'user'
        return { command, defaultShortcut, userShortcut, source }
      })
      .filter((row) => {
        if (!terms.length) return true
        const haystack = [row.command.id, row.command.title, row.command.category, row.userShortcut]
          .join(' ')
          .toLowerCase()
        return terms.every((term) => haystack.includes(term))
      })
  })

  function isCommandCategory(categoryId: string) {
    return categoryId === 'commands' || categoryId === 'keybindings'
  }

  function conflictsFor(commandId: string, shortcut: string) {
    if (!shortcut) return []
    return commandRows.value.filter(
      (row) =>
        row.command.id !== commandId && row.userShortcut.toLowerCase() === shortcut.toLowerCase(),
    )
  }

  async function updateSetting(id: string, value: unknown) {
    await runtime.settings.set(id, value)
  }

  async function resetSetting(id: string) {
    await runtime.settings.reset(id)
  }

  async function resetShown() {
    await runtime.settings.resetAll(baseSettings.value.map((entry) => entry.id))
  }

  function exportShown() {
    exportDraft.value = runtime.settings.export(baseSettings.value.map((entry) => entry.id))
    void runtime.host.capabilities.clipboard?.writeText?.(exportDraft.value)
  }

  async function importSettings() {
    importMessage.value = ''
    try {
      const result = await runtime.settings.import(importDraft.value)
      importMessage.value = `${result.applied.length} applied, ${result.rejected.length} rejected`
    } catch (error) {
      importMessage.value = error instanceof Error ? error.message : String(error)
    }
  }

  function startKeybindingEdit(commandId: string, current: string) {
    editingCommandId.value = commandId
    keybindingDraft.value = current
  }

  async function saveKeybinding(commandId: string) {
    const settingId = `keybindings.${commandId}`
    if (!runtime.settings.entries.some((entry) => entry.id === settingId)) {
      runtime.settings.register({
        ownerExtensionId: 'activelane.workbench',
        ownerExtensionName: 'ActiveLane Workbench',
        category: 'Keyboard Shortcuts',
        settings: [
          {
            id: settingId,
            label: `Keybinding: ${commandId}`,
            description: 'User override for a Workbench command keybinding.',
            category: 'Keyboard Shortcuts',
            type: 'keybinding',
            defaultValue:
              runtime.registry.commands.find((command) => command.id === commandId)?.shortcut ?? '',
            tags: ['keyboard', 'shortcut', commandId],
          },
        ],
      })
    }
    await runtime.settings.set(settingId, keybindingDraft.value.trim())
    editingCommandId.value = null
  }

  return {
    runtime,
    query,
    activeCategory,
    showModified,
    showExtensionSettings,
    importDraft,
    importMessage,
    exportDraft,
    editingCommandId,
    keybindingDraft,
    categories,
    baseSettings,
    groupedSettings,
    activeCategoryLabel,
    commandRows,
    isCommandCategory,
    conflictsFor,
    updateSetting,
    resetSetting,
    resetShown,
    exportShown,
    importSettings,
    startKeybindingEdit,
    saveKeybinding,
  }
}

function searchableText(entry: WorkbenchSettingEntry) {
  return [
    entry.id,
    entry.label,
    entry.description,
    entry.category,
    entry.subcategory,
    entry.ownerExtensionName,
    ...(entry.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

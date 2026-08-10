import type {
  ActiveLaneSettingDefinition,
  ActiveLaneSettingsContribution,
  Disposable,
  WorkbenchSettingDefinition,
  WorkbenchSettingEntry,
  WorkbenchSettingsContribution,
  WorkbenchSettingsImportResult,
  WorkbenchSettingsService,
  WorkbenchStorageScope,
} from '../index'
import { resolveWorkbenchReactivity, type WorkbenchReactivityAdapter } from './reactivity'

export const WORKBENCH_SETTINGS_STORAGE_KEY = 'settings-values'

type Listener = (entry: WorkbenchSettingEntry) => void

const KNOWN_TYPES = new Set([
  'boolean',
  'string',
  'number',
  'enum',
  'array',
  'multi-select',
  'keybinding',
  'json',
  'color',
  'path',
  'object',
])

function clone<T>(value: T): T {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateValue(definition: WorkbenchSettingDefinition, value: unknown) {
  if (definition.validate) return definition.validate(value)
  if (!KNOWN_TYPES.has(definition.type)) return `Unsupported setting type "${definition.type}".`
  if (definition.type === 'boolean' && typeof value !== 'boolean') return 'Expected a boolean.'
  if (definition.type === 'number' && typeof value !== 'number') return 'Expected a number.'
  if (
    ['string', 'path', 'keybinding', 'color'].includes(definition.type) &&
    typeof value !== 'string'
  ) {
    return 'Expected a string.'
  }
  if (['array', 'multi-select'].includes(definition.type) && !Array.isArray(value))
    return 'Expected an array.'
  if (
    ['json', 'object'].includes(definition.type) &&
    (value === null || typeof value !== 'object')
  ) {
    return 'Expected an object.'
  }
  if (definition.options?.length) {
    const allowed = new Set(definition.options.map((option) => option.value))
    if (definition.type === 'multi-select') {
      const values = Array.isArray(value) ? value : []
      if (values.some((item) => !allowed.has(item))) return 'Contains an unsupported option.'
    } else if (!allowed.has(value as string | number | boolean)) {
      return 'Unsupported option.'
    }
  }
  return null
}

function titleFromKey(key: string) {
  const last = key.split('.').at(-1) ?? key
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function defaultForProperty(property: ActiveLaneSettingDefinition) {
  if (property.default !== undefined) return property.default
  if (property.type === 'enum') return property.enum?.[0]
  if (property.type === 'boolean') return false
  if (property.type === 'number') return 0
  if (property.type === 'array') return []
  if (property.type === 'object') return {}
  return ''
}

function normalizeSchemaSetting(
  group: ActiveLaneSettingsContribution,
  key: string,
  property: ActiveLaneSettingDefinition,
  ownerExtensionId?: string,
  ownerExtensionName?: string,
): WorkbenchSettingDefinition {
  const options = property.enum?.map((value, index) => ({
    value: value as string | number | boolean,
    label: property.enumLabels?.[index] ?? String(value),
    description: property.enumDescriptions?.[index],
  }))

  return {
    id: key,
    label: property.title ?? titleFromKey(key),
    description: property.description,
    category: ownerExtensionId ? 'Extensions' : group.title,
    subcategory: group.title,
    type: property.type === 'array' ? 'array' : property.type,
    defaultValue: clone(defaultForProperty(property)),
    options,
    tags: property.tags,
    scope: property.scope,
    required: property.required,
    readonly: property.readonly,
    ownerExtensionId,
    ownerExtensionName,
    render:
      property.minimum !== undefined || property.maximum !== undefined
        ? { min: property.minimum, max: property.maximum }
        : undefined,
  }
}

function isSchemaContribution(value: unknown): value is ActiveLaneSettingsContribution {
  return isObject(value) && typeof value.id === 'string' && isObject(value.properties)
}

function normalizeContribution(contribution: WorkbenchSettingsContribution) {
  const settings = [...(contribution.settings ?? [])]
  for (const group of contribution.groups ?? []) {
    for (const [key, property] of Object.entries(group.properties)) {
      settings.push(
        normalizeSchemaSetting(
          group,
          key,
          property,
          contribution.ownerExtensionId,
          contribution.ownerExtensionName,
        ),
      )
    }
  }
  return settings.map((setting) => ({
    ...setting,
    category: setting.category || contribution.category || 'Extensions',
    ownerExtensionId: setting.ownerExtensionId ?? contribution.ownerExtensionId,
    ownerExtensionName: setting.ownerExtensionName ?? contribution.ownerExtensionName,
  }))
}

function validateDefinition(definition: WorkbenchSettingDefinition) {
  if (!definition.id.trim()) return 'Setting key is required.'
  if (!definition.label.trim()) return 'Setting title is required.'
  if (!KNOWN_TYPES.has(definition.type)) return `Unsupported setting type "${definition.type}".`
  const defaultError = validateValue(definition, definition.defaultValue)
  if (defaultError) return `Invalid default: ${defaultError}`
  if (definition.options?.length) {
    for (const option of definition.options) {
      const optionError = validateValue({ ...definition, options: undefined }, option.value)
      if (optionError) return `Invalid enum option "${String(option.value)}": ${optionError}`
    }
  }
  return null
}

export async function createSettingsService(
  storage: WorkbenchStorageScope,
  reactivity?: Partial<WorkbenchReactivityAdapter>,
): Promise<WorkbenchSettingsService> {
  const reactive = resolveWorkbenchReactivity(reactivity).reactive
  const entries = reactive<WorkbenchSettingEntry[]>([])
  const definitions = new Map<string, WorkbenchSettingDefinition>()
  const definitionOwners = new Map<string, string>()
  const listeners = new Set<Listener>()
  const persisted =
    (await storage.get<Record<string, unknown>>(WORKBENCH_SETTINGS_STORAGE_KEY)) ?? {}
  const values = reactive<Record<string, unknown>>({ ...persisted })

  async function persist() {
    await storage.set(WORKBENCH_SETTINGS_STORAGE_KEY, clone(values))
  }

  function rebuildEntry(definition: WorkbenchSettingDefinition): WorkbenchSettingEntry {
    const hasValue = Object.hasOwn(values, definition.id)
    const value = hasValue ? values[definition.id] : clone(definition.defaultValue)
    const validationError = validateValue(definition, value)
    const safeValue = validationError ? clone(definition.defaultValue) : value
    return {
      ...definition,
      value: safeValue,
      modified: !sameValue(safeValue, definition.defaultValue),
      validationError,
    }
  }

  function upsert(definition: WorkbenchSettingDefinition) {
    definitions.set(definition.id, definition)
    const entry = rebuildEntry(definition)
    const index = entries.findIndex((item) => item.id === definition.id)
    if (index >= 0) entries.splice(index, 1, entry)
    else entries.push(entry)
    entries.sort(
      (left, right) =>
        left.category.localeCompare(right.category) || left.label.localeCompare(right.label),
    )
    return entry
  }

  function emit(entry: WorkbenchSettingEntry) {
    listeners.forEach((listener) => {
      listener(entry)
    })
  }

  const service: WorkbenchSettingsService = {
    entries,
    register(contribution: WorkbenchSettingsContribution): Disposable {
      const owned = normalizeContribution(contribution)
      const registered: WorkbenchSettingDefinition[] = []
      for (const setting of owned) {
        const owner = setting.ownerExtensionId ?? 'workbench'
        const currentOwner = definitionOwners.get(setting.id)
        if (currentOwner && currentOwner !== owner) {
          console.warn(
            `[ActiveLane settings] Ignoring duplicate setting "${setting.id}" from "${owner}". Already registered by "${currentOwner}".`,
          )
          continue
        }
        const error = validateDefinition(setting)
        if (error) {
          console.warn(`[ActiveLane settings] Ignoring invalid setting "${setting.id}": ${error}`)
          continue
        }
        definitionOwners.set(setting.id, owner)
        upsert(setting)
        registered.push(setting)
      }
      return {
        dispose() {
          for (const setting of registered) {
            const index = entries.findIndex((entry) => entry.id === setting.id)
            const entry = index >= 0 ? entries[index] : undefined
            if (entry) entry.missingOwner = Boolean(setting.ownerExtensionId)
          }
        },
      }
    },
    get<T = unknown>(id: string, fallback?: T) {
      return (entries.find((entry) => entry.id === id)?.value ?? fallback) as T | undefined
    },
    async set<T = unknown>(id: string, value: T) {
      const definition = definitions.get(id)
      if (!definition) return false
      if (definition.readonly) return false
      const validationError = validateValue(definition, value)
      if (validationError) {
        upsert(definition)
        return false
      }
      const existingValue = Object.hasOwn(values, id) ? values[id] : definition.defaultValue
      if (sameValue(existingValue, value)) return true
      if (sameValue(value, definition.defaultValue)) delete values[id]
      else values[id] = clone(value)
      await persist()
      emit(upsert(definition))
      return true
    },
    inspect<T = unknown>(id: string) {
      const definition = definitions.get(id)
      const hasUserValue = Object.hasOwn(values, id)
      const userValue = hasUserValue ? (values[id] as T) : undefined
      const entry = entries.find((item) => item.id === id)
      return {
        key: id,
        defaultValue: definition?.defaultValue as T | undefined,
        userValue,
        effectiveValue: entry?.value as T | undefined,
        source: hasUserValue ? 'user' : 'default',
      }
    },
    async reset(id: string) {
      const definition = definitions.get(id)
      if (!definition) return
      delete values[id]
      await persist()
      emit(upsert(definition))
    },
    async resetCategory(category: string) {
      for (const definition of definitions.values()) {
        if (definition.category === category) delete values[definition.id]
      }
      await persist()
      for (const definition of definitions.values()) {
        if (definition.category === category) emit(upsert(definition))
      }
    },
    async resetAll(ids?: string[]) {
      const targets = new Set(ids ?? Array.from(definitions.keys()))
      for (const id of targets) delete values[id]
      await persist()
      for (const id of targets) {
        const definition = definitions.get(id)
        if (definition) emit(upsert(definition))
      }
    },
    export(ids?: string[]) {
      const targets = new Set(ids ?? entries.map((entry) => entry.id))
      const payload: Record<string, unknown> = {}
      for (const entry of entries) {
        if (targets.has(entry.id)) payload[entry.id] = entry.value
      }
      return JSON.stringify(payload, null, 2)
    },
    async import(contents: string): Promise<WorkbenchSettingsImportResult> {
      const parsed = JSON.parse(contents) as Record<string, unknown>
      const result: WorkbenchSettingsImportResult = { applied: [], rejected: [] }
      for (const [id, value] of Object.entries(parsed)) {
        const definition = definitions.get(id)
        if (!definition) {
          result.rejected.push({ id, reason: 'Unknown setting.' })
          continue
        }
        const error = validateValue(definition, value)
        if (error) {
          result.rejected.push({ id, reason: error })
          continue
        }
        if (sameValue(value, definition.defaultValue)) delete values[id]
        else values[id] = clone(value)
        result.applied.push(id)
      }
      await persist()
      for (const id of result.applied) {
        const definition = definitions.get(id)
        if (definition) emit(upsert(definition))
      }
      return result
    },
    onDidChange(listener) {
      listeners.add(listener)
      return {
        dispose() {
          listeners.delete(listener)
        },
      }
    },
  }
  return service
}

export function normalizeManifestSettings(
  settings: Array<WorkbenchSettingDefinition | ActiveLaneSettingsContribution>,
): WorkbenchSettingsContribution {
  const legacySettings: WorkbenchSettingDefinition[] = []
  const groups: ActiveLaneSettingsContribution[] = []
  for (const item of settings) {
    if (isSchemaContribution(item)) groups.push(item)
    else legacySettings.push(item)
  }
  return { settings: legacySettings, groups }
}

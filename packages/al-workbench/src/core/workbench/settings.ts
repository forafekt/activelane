import type { Disposable } from '../shared/types'

export type WorkbenchSettingScope =
  | 'application'
  | 'user'
  | 'workspace'
  | 'project'
  | 'extension'
  | 'session'

export type WorkbenchSettingType =
  | 'boolean'
  | 'string'
  | 'number'
  | 'enum'
  | 'array'
  | 'multi-select'
  | 'keybinding'
  | 'json'
  | 'color'
  | 'path'
  | 'object'

export interface WorkbenchSettingOption {
  label: string
  value: string | number | boolean
  description?: string
}

export interface WorkbenchSettingRenderHints {
  control?: 'switch' | 'select' | 'slider' | 'textarea' | 'json' | 'color' | 'path' | 'keybinding'
  min?: number
  max?: number
  step?: number
  rows?: number
  placeholder?: string
}

export interface WorkbenchSettingIntegration {
  status: 'wired' | 'integration-point' | 'reserved'
  reason?: string
}

export interface WorkbenchSettingDefinition<T = unknown> {
  id: string
  label: string
  description?: string
  category: string
  subcategory?: string
  type: WorkbenchSettingType
  defaultValue: T
  options?: WorkbenchSettingOption[]
  tags?: string[]
  scope?: WorkbenchSettingScope
  requiresReload?: boolean
  required?: boolean
  readonly?: boolean
  experimental?: boolean
  ownerExtensionId?: string
  ownerExtensionName?: string
  render?: WorkbenchSettingRenderHints
  integration?: WorkbenchSettingIntegration
  validate?: (value: T) => string | null
}

export interface ActiveLaneSettingDefinition {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object'
  title?: string
  description?: string
  default?: unknown
  enum?: readonly unknown[]
  enumLabels?: readonly string[]
  enumDescriptions?: readonly string[]
  minimum?: number
  maximum?: number
  required?: boolean
  readonly?: boolean
  scope?: 'application' | 'workspace' | 'extension'
  tags?: string[]
  order?: number
}

export interface ActiveLaneSettingsContribution {
  id: string
  title: string
  description?: string
  order?: number
  properties: Record<string, ActiveLaneSettingDefinition>
}

export interface WorkbenchSettingEntry<T = unknown> extends WorkbenchSettingDefinition<T> {
  value: T
  modified: boolean
  validationError: string | null
  missingOwner?: boolean
}

export interface WorkbenchSettingsInspection<T = unknown> {
  key: string
  defaultValue: T | undefined
  userValue?: T
  effectiveValue: T | undefined
  source: 'default' | 'user'
}

export interface WorkbenchSettingsContribution {
  ownerExtensionId?: string
  ownerExtensionName?: string
  category?: string
  settings?: WorkbenchSettingDefinition[]
  groups?: ActiveLaneSettingsContribution[]
}

export interface WorkbenchSettingsImportResult {
  applied: string[]
  rejected: Array<{ id: string; reason: string }>
}

export interface WorkbenchSettingsService {
  entries: WorkbenchSettingEntry[]
  register: (contribution: WorkbenchSettingsContribution) => Disposable
  get: {
    <T = unknown>(id: string): T | undefined
    <T = unknown>(id: string, fallback: T): T
  }
  set: <T = unknown>(id: string, value: T) => Promise<boolean>
  inspect: <T = unknown>(id: string) => WorkbenchSettingsInspection<T>
  reset: (id: string) => Promise<void>
  resetCategory: (category: string) => Promise<void>
  resetAll: (ids?: string[]) => Promise<void>
  export: (ids?: string[]) => string
  import: (contents: string) => Promise<WorkbenchSettingsImportResult>
  onDidChange: (listener: (entry: WorkbenchSettingEntry) => void) => Disposable
}

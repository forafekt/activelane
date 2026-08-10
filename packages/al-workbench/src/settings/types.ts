export type {
  WorkbenchSettingDefinition,
  WorkbenchSettingEntry,
  WorkbenchSettingOption,
  WorkbenchSettingRenderHints,
  WorkbenchSettingScope,
  WorkbenchSettingsContribution,
  WorkbenchSettingsImportResult,
  WorkbenchSettingsService,
  WorkbenchSettingType,
} from '../core/workbench/settings'

export interface WorkbenchSettingsCategory {
  id: string
  label: string
  description?: string
}

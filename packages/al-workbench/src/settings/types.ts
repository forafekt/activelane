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
} from '@activelane/workbench-api'

export interface WorkbenchSettingsCategory {
  id: string
  label: string
  description?: string
}

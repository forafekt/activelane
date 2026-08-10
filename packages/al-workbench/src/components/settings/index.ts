import { type App, defineAsyncComponent } from 'vue'

export const BooleanSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './BooleanSettingRow.vue'),
)
export const ColorSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './ColorSettingRow.vue'),
)
export const CustomSettingRenderer = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './CustomSettingRenderer.vue'),
)
export const EnumSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './EnumSettingRow.vue'),
)
export const KeyBindingSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './KeybindingSettingRow.vue'),
)
export const MultiSelectSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './MultiSelectSettingRow.vue'),
)
export const NumberSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './NumberSettingRow.vue'),
)
export const SettingsCommandRows = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './SettingsCommandRows.vue'),
)
export const SettingsJsonTransfer = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './SettingsJsonTransfer.vue'),
)
export const SliderSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './SliderSettingRow.vue'),
)
export const StringSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './SliderSettingRow.vue'),
)
export const WorkbenchSettingRow = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchSettingRow.vue'),
)
export const WorkbenchSettingsView = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchSettingsView.vue'),
)

const components = {
  BooleanSettingRow,
  ColorSettingRow,
  CustomSettingRenderer,
  EnumSettingRow,
  KeyBindingSettingRow,
  MultiSelectSettingRow,
  NumberSettingRow,
  SettingsCommandRows,
  SettingsJsonTransfer,
  SliderSettingRow,
  StringSettingRow,
  WorkbenchSettingRow,
  WorkbenchSettingsView,
}

export const WorkbenchSettingsComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
} as const

import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchCommandPalette = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchCommandPalette.vue'),
)

export const WorkbenchCommandBarResults = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchCommandBarResults.vue'),
)

export const WorkbenchCommandBar = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchCommandBar.vue'),
)

const components = {
  WorkbenchCommandPalette,
  WorkbenchCommandBarResults,
  WorkbenchCommandBar,
}

export const WorkbenchCommandPaletteComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

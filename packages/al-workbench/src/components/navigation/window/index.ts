import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchTopBar = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchTopBar.vue'),
)

export const WorkbenchLayoutControls = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchLayoutControls.vue'),
)

const components = {
  WorkbenchTopBar,
  WorkbenchLayoutControls,
}

export const WorkbenchWindowComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
} as const

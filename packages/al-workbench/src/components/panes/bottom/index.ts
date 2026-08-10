import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchBottomPane = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchBottomPane.vue'),
)

const components = {
  WorkbenchBottomPane,
}

export const WorkbenchBottomPaneComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

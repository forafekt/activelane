import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchInspectorPane = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchInspectorPane.vue'),
)

const components = {
  WorkbenchInspectorPane,
}

export const WorkbenchRightPaneComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

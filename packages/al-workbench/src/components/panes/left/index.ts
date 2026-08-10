import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchSidebarPane = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchSidebarPane.vue'),
)

const components = {
  WorkbenchSidebarPane,
}

export const WorkbenchLeftPaneComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

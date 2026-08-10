import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchStatusBar = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchStatusBar.vue'),
)

const components = {
  WorkbenchStatusBar,
}

export const WorkbenchStatusBarComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
} as const

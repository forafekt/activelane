import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchTitleBar = defineAsyncComponent(
  () =>
    import(
      /* webpackPrefetch: true, vitePrefetch: true */ './shared/components/title-bar/WorkbenchTitleBar.vue'
    ),
)

const components = {
  WorkbenchTitleBar,
}

export const WorkbenchTitleBarComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

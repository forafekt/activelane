import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchGlobalMenuLauncher = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchGlobalMenuLauncher.vue'),
)

const components = {
  WorkbenchGlobalMenuLauncher,
}

export const WorkbenchMenuComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchActivityRail = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchActivityRail.vue'),
)

export const WorkbenchActivityItem = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchActivityItem.vue'),
)

const components = {
  WorkbenchActivityRail,
  WorkbenchActivityItem,
}

export const WorkbenchActivityRailComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
} as const

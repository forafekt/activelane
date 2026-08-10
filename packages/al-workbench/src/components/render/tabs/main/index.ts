import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchTabContextMenu = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchTabContextMenu.vue'),
)
export const WorkbenchTabGroup = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchTabGroup.vue'),
)
export const WorkbenchTabItem = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchTabItem.vue'),
)

export const WorkbenchTabStrip = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchTabStrip.vue'),
)

const components = {
  WorkbenchTabContextMenu,
  WorkbenchTabGroup,
  WorkbenchTabItem,
  WorkbenchTabStrip,
}

export const WorkbenchTabsComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

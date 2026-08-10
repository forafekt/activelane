import { type App, defineAsyncComponent } from 'vue'

export const WorkbenchChromeLayout = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchChromeLayout.vue'),
)
export const WorkbenchExtensionBoundary = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchExtensionBoundary.vue'),
)
export const WorkbenchShell = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchShell.vue'),
)
export const WorkbenchSplitLayout = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchSplitLayout.vue'),
)
export const WorkbenchSurfaceRenderer = defineAsyncComponent(
  () => import(/* webpackPrefetch: true, vitePrefetch: true */ './WorkbenchSurfaceRenderer.vue'),
)

const components = {
  WorkbenchChromeLayout,
  WorkbenchExtensionBoundary,
  WorkbenchShell,
  WorkbenchSplitLayout,
  WorkbenchSurfaceRenderer,
}

export const WorkbenchSurfaceComponents = {
  ...components,
  install: (app: App) => {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

import WorkbenchBrowserSurface from './components/WorkbenchBrowserSurface.vue'
import { WORKBENCH_BROWSER_TAB_KIND } from './types'

export function createBrowserTabRenderer() {
  return {
    id: 'workbench.browser.renderer',
    title: 'Browser',
    tabKind: WORKBENCH_BROWSER_TAB_KIND,
    component: WorkbenchBrowserSurface,
  }
}

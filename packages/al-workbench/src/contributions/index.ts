import type { WorkbenchExtensionCatalogEntry } from '@activelane/workbench-api'
import { createWorkbenchBrowserContribution } from './browser'
import { createWorkbenchCoreContribution } from './core'
import { createWorkbenchExplorerContribution } from './explorer'
import { createWorkbenchFileContribution } from './file'
import { createWorkbenchHomeContribution } from './home'
import { createWorkbenchServersContribution } from './servers'
// import { createWorkbenchSurfacePlaygroundContribution } from './surfacePlayground'

export function createWorkbenchBuiltinExtensions(): WorkbenchExtensionCatalogEntry[] {
  return [
    {
      definition: createWorkbenchCoreContribution(),
      source: 'builtin',
    },
    {
      definition: createWorkbenchExplorerContribution(),
      source: 'builtin',
    },
    {
      definition: createWorkbenchFileContribution(),
      source: 'builtin',
    },
    {
      definition: createWorkbenchHomeContribution(),
      source: 'builtin',
    },
    {
      definition: createWorkbenchBrowserContribution(),
      source: 'builtin',
    },
    {
      definition: createWorkbenchServersContribution(),
      source: 'builtin',
    },
    // {
    //   definition: createWorkbenchSurfacePlaygroundContribution(),
    //   source: 'builtin',
    // },
  ]
}

export { createWorkbenchBrowserContribution } from './browser'
export { createWorkbenchCoreContribution } from './core'
export { createWorkbenchExplorerContribution } from './explorer'
export { createWorkbenchFileContribution } from './file'
export { createWorkbenchHomeContribution, openWorkbenchHome, WORKBENCH_HOME_TAB_KIND } from './home'
export { createWorkbenchServersContribution } from './servers'
export { createWorkbenchSurfacePlaygroundContribution } from './surfacePlayground'

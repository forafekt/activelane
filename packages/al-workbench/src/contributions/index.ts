import type { WorkbenchExtensionCatalogEntry } from '../core/extensions/types'

// import { createWorkbenchBrowserContribution } from './browser'
import { createWorkbenchCoreContribution } from './core'
// import { createWorkbenchExplorerContribution } from './explorer'
// import { createWorkbenchFileContribution } from './file'
// import { createWorkbenchServersContribution } from './servers'

export function createWorkbenchBuiltinExtensions(): WorkbenchExtensionCatalogEntry[] {
  return [
    {
      definition: createWorkbenchCoreContribution(),
      source: 'builtin',
    },
    // {
    //   definition: createWorkbenchExplorerContribution(),
    //   source: 'builtin',
    // },
    // {
    //   definition: createWorkbenchFileContribution(),
    //   source: 'builtin',
    // },
    // {
    //   definition: createWorkbenchBrowserContribution(),
    //   source: 'builtin',
    // },
    // {
    //   definition: createWorkbenchServersContribution(),
    //   source: 'builtin',
    // },
  ]
}

export { createWorkbenchBrowserContribution } from './browser'
export { createWorkbenchCoreContribution } from './core'
export { createWorkbenchExplorerContribution } from './explorer'
export { createWorkbenchFileContribution } from './file'
export { createWorkbenchServersContribution } from './servers'

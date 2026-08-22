import type { WorkbenchExtensionCatalogEntry } from '../core/extensions/types'

import { createWorkbenchCoreContribution } from './core'

export function createWorkbenchBuiltinExtensions(): WorkbenchExtensionCatalogEntry[] {
  return [
    {
      definition: createWorkbenchCoreContribution(),
      source: 'builtin',
    },
  ]
}

export { createWorkbenchCoreContribution } from './core'

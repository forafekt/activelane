import type { WorkbenchExtensionCatalogEntry } from '@activelane/workbench'
import { createWorkbenchBuiltinExtensions } from '@activelane/workbench'
import { createExtensionsMarketplaceExtension } from '@activelane/workbench/marketplace'
import { createActiveLaneThemeExtensions } from '@activelane/workbench/themes'

function builtin(
  definition: WorkbenchExtensionCatalogEntry['definition'],
): WorkbenchExtensionCatalogEntry {
  return { definition, source: 'builtin' }
}

export function createDesktopExtensionCatalog(): WorkbenchExtensionCatalogEntry[] {
  return [
    ...createWorkbenchBuiltinExtensions(),
    ...createActiveLaneThemeExtensions().map(builtin),
    builtin(createExtensionsMarketplaceExtension()),
  ]
}

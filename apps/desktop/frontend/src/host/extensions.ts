import { createWorkbenchBuiltinExtensions } from '@activelane/workbench'
import type { WorkbenchExtensionCatalogEntry } from '@activelane/workbench/extensions'
import { createExtensionsMarketplaceExtension } from '@activelane/workbench/marketplace'
import { createActiveLaneThemeExtensions } from '@activelane/workbench/themes'
import { createApiStudioExtension } from '../../../../../extensions/api-studio/src/extension'

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
    { definition: createApiStudioExtension(), source: 'remote' },
  ]
}

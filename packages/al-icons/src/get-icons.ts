import { getIcon } from './get-icon'
import type { IconReference } from './icon-reference'

export function getIcons(references: IconReference[]) {
  return references.map((reference) => getIcon(reference))
}

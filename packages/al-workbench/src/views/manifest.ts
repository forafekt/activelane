import type { ViewContainer, ViewDefinition, ViewLocation } from './model'

const locations = new Set<ViewLocation>([
  'primary-sidebar',
  'secondary-sidebar',
  'editor',
  'panel',
  'auxiliary',
])

export interface ViewManifestIssue {
  path: string
  message: string
}

export function validateViewContributions(input: {
  containers?: readonly ViewContainer[]
  views?: readonly ViewDefinition[]
}) {
  const issues: ViewManifestIssue[] = []
  const containers = new Map<string, ViewContainer>()
  for (const [index, container] of (input.containers ?? []).entries()) {
    if (!container.id)
      issues.push({
        path: `contributes.containers.${index}.id`,
        message: 'Container id is required.',
      })
    if (!locations.has(container.location))
      issues.push({
        path: `contributes.containers.${index}.location`,
        message: 'Unsupported Workbench location.',
      })
    if (containers.has(container.id))
      issues.push({
        path: `contributes.containers.${index}.id`,
        message: `Duplicate container ${container.id}.`,
      })
    containers.set(container.id, container)
  }
  const viewIds = new Set<string>()
  for (const [index, view] of (input.views ?? []).entries()) {
    if (viewIds.has(view.id))
      issues.push({ path: `contributes.views.${index}.id`, message: `Duplicate view ${view.id}.` })
    viewIds.add(view.id)
    if (!containers.has(view.container))
      issues.push({
        path: `contributes.views.${index}.container`,
        message: `Unknown container ${view.container}.`,
      })
    if (view.renderer.type === 'isolated') {
      try {
        normalizeViewEntry(view.renderer.entry)
      } catch (error) {
        issues.push({
          path: `contributes.views.${index}.renderer.entry`,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  return issues
}

export function normalizeViewEntry(entry: string) {
  const value = entry.replaceAll('\\', '/').replace(/^\.\//, '')
  if (!value.endsWith('.html') || value.startsWith('/') || value.split('/').includes('..')) {
    throw new Error('Isolated view entry must be a package-relative HTML file.')
  }
  return value
}

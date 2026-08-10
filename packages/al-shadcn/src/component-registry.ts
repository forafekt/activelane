import type { Component } from 'vue'

type ComponentModuleMap = Record<string, Component>

const componentModules = import.meta.glob('./components/**/*.vue', {
  eager: true,
  import: 'default',
}) as ComponentModuleMap

const alComponentRoots = new Set([
  'command',
  'dashboard',
  'data-display',
  'feedback',
  'forms',
  'layout',
  'navigation',
  'overlays',
  'sidepanel',
  'theme',
])

function toPascalCase(value: string) {
  return value
    .replace(/\.vue$/, '')
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function componentNameFromPath(path: string) {
  const [, relativePath = path] = path.split('./components/')
  const parts = relativePath.split('/')
  const fileName = parts.at(-1) ?? relativePath
  const root = parts[0] ?? ''
  const baseName = toPascalCase(fileName)

  let result: string = baseName
  if (alComponentRoots.has(root) || (root === 'ui' && parts.length === 2)) {
    result = `Al${baseName}`
  }

  return result
}

function createInstallComponents() {
  const registry = new Map<string, Component>()

  for (const [path, component] of Object.entries(componentModules)) {
    const name = componentNameFromPath(path)
    if (registry.has(name)) {
      throw new Error(`Duplicate @activelane/shadcn global component name: ${name}`)
    }
    registry.set(name, component)
  }

  return Array.from(registry.entries()).sort(([left], [right]) => left.localeCompare(right))
}

export const installComponents = createInstallComponents()

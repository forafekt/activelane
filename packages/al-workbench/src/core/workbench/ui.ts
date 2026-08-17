import type { IconReference } from '@activelane/icons'
import type { Disposable } from '../shared/types'

// Opaque UI handles owned by integration packages. The core runtime stores and
// forwards them without importing a framework-specific component type.
export type WorkbenchComponent = object
export type WorkbenchIcon = WorkbenchComponent

export type WorkbenchUIBulkResult<N extends readonly string[], T> = {
  [K in N[number]]: T | undefined
} & Array<T | undefined>

export type WorkbenchUI = {
  getComponent: (name: string) => WorkbenchComponent | undefined
  getComponents: <const N extends readonly string[]>(
    names: N,
  ) => WorkbenchUIBulkResult<N, WorkbenchComponent>
  getIcon: (name: IconReference) => WorkbenchIcon | undefined
  registerComponent: (name: string, component: WorkbenchComponent) => Disposable
  registerComponents: (entries: [name: string, component: WorkbenchComponent][]) => Disposable
}

export function createWorkbenchUIBulkResult<const N extends readonly string[], T>(
  names: N,
  resolve: (name: N[number]) => T | undefined,
): WorkbenchUIBulkResult<N, T> {
  const values = names.map((name) => resolve(name)) as WorkbenchUIBulkResult<N, T>
  names.forEach((name, index) => {
    Object.defineProperty(values, name, {
      enumerable: true,
      configurable: true,
      get: () => values[index],
    })
  })
  return values
}

export function createWorkbenchUI(overrides: Partial<WorkbenchUI> = {}): WorkbenchUI {
  const components = new Map<string, WorkbenchComponent>()

  const removeFrom = <T>(map: Map<string, T>, names: string[]): Disposable => ({
    dispose() {
      for (const name of names) map.delete(name)
    },
  })

  const base: WorkbenchUI = {
    getComponent: (name) => {
      const component = components.get(name)
      if (!component) {
        console.error(`Could not find component: ${name}`)
        return
      }
      return component
    },
    getComponents: (names) => createWorkbenchUIBulkResult(names, (name) => base.getComponent(name)),
    getIcon: (name) => {
      console.error(`No icon renderer is configured for: ${name}`)
      return undefined
    },
    registerComponent(name, component) {
      components.set(name, component)
      return removeFrom(components, [name])
    },
    registerComponents(entries) {
      for (const [name, component] of entries) components.set(name, component)
      return removeFrom(
        components,
        entries.map(([name]) => name),
      )
    },
  }

  return { ...base, ...overrides }
}

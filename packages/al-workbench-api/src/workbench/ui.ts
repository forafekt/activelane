import type { Disposable } from '../shared/types'

type Component =
  | object
  | {
      new (...args: any[]): any
    }
  | ((...args: any[]) => any)

// Opaque UI handles owned by integration packages. The core runtime stores and
// forwards them without importing a framework-specific component type.
export type WorkbenchComponent = Component
export type WorkbenchIcon = Component

export type WorkbenchUIBulkResult<N extends readonly string[], T> = {
  [K in N[number]]: T | undefined
} & Array<T | undefined>

export type WorkbenchUI = {
  getComponent: (name: string) => WorkbenchComponent | undefined
  getComponents: <const N extends readonly string[]>(
    names: N,
  ) => WorkbenchUIBulkResult<N, WorkbenchComponent>
  getIcon: (name: string) => WorkbenchIcon | undefined
  getIcons: <const N extends readonly string[]>(names: N) => WorkbenchUIBulkResult<N, WorkbenchIcon>
  registerComponent: (name: string, component: WorkbenchComponent) => Disposable
  registerIcon: (name: string, component: WorkbenchIcon) => Disposable
  registerComponents: (entries: [name: string, component: WorkbenchComponent][]) => Disposable
  registerIcons: (entries: [name: string, component: WorkbenchIcon][]) => Disposable
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
  const icons = new Map<string, WorkbenchIcon>()

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
      const icon = icons.get(name)
      if (!icon) {
        console.error(`Could not find icon: ${name}`)
        return
      }
      return icon
    },
    getIcons: (names) => createWorkbenchUIBulkResult(names, (name) => base.getIcon(name)),
    registerComponent(name, component) {
      components.set(name, component)
      return removeFrom(components, [name])
    },
    registerIcon(name, component) {
      icons.set(name, component)
      return removeFrom(icons, [name])
    },
    registerComponents(entries) {
      for (const [name, component] of entries) components.set(name, component)
      return removeFrom(
        components,
        entries.map(([name]) => name),
      )
    },
    registerIcons(entries) {
      for (const [name, component] of entries) icons.set(name, component)
      return removeFrom(
        icons,
        entries.map(([name]) => name),
      )
    },
  }

  return { ...base, ...overrides }
}

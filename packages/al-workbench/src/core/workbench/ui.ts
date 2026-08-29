import type { IconReference } from '@activelane/icons'
import type { workbenchBlockRegistry } from '../../ui/registry/blocks'
import type { workbenchComponentRegistry } from '../../ui/registry/components'

// Opaque UI handles owned by integration packages. The core runtime stores and
// forwards them without importing a framework-specific component type.
export type WorkbenchComponent = import('vue').Component

export type WorkbenchIcon = WorkbenchComponent

export type WorkbenchComponentMap = typeof workbenchComponentRegistry

export type WorkbenchBlockMap = typeof workbenchBlockRegistry

export type WorkbenchComponentId = keyof WorkbenchComponentMap

export type WorkbenchBlockId = keyof WorkbenchBlockMap

export type WorkbenchUIBulkResult<
  N extends readonly (keyof M)[],
  M extends Record<PropertyKey, unknown>,
> = {
  readonly [I in keyof N]: N[I] extends keyof M ? M[N[I]] : never
} & {
  readonly [K in N[number]]: M[K]
}

export interface WorkbenchUI {
  getComponent<K extends WorkbenchComponentId>(id: K): WorkbenchComponentMap[K]
  getComponents<const N extends readonly WorkbenchComponentId[]>(
    ids: N,
  ): WorkbenchUIBulkResult<N, WorkbenchComponentMap>
  getBlock<K extends WorkbenchBlockId>(id: K): WorkbenchBlockMap[K]
  getBlocks<const N extends readonly WorkbenchBlockId[]>(
    ids: N,
  ): WorkbenchUIBulkResult<N, WorkbenchBlockMap>
  getIcon(name: IconReference): WorkbenchIcon | undefined
}

export function createWorkbenchUIBulkResult<
  const N extends readonly (keyof M)[],
  M extends Record<PropertyKey, unknown>,
>(names: N, resolve: <K extends N[number]>(name: K) => M[K]): WorkbenchUIBulkResult<N, M> {
  const values = names.map((name) => resolve(name)) as unknown as WorkbenchUIBulkResult<N, M>
  names.forEach((name, index) => {
    Object.defineProperty(values, name, {
      enumerable: true,
      configurable: false,
      get: () => values[index],
    })
  })
  return values
}

export function createWorkbenchUI(overrides: Partial<WorkbenchUI> = {}): WorkbenchUI {
  const base: WorkbenchUI = {
    getComponent: (id) => {
      throw new Error(`Unknown Workbench UI component: ${String(id)}`)
    },
    getComponents: (ids) => createWorkbenchUIBulkResult(ids, (id) => base.getComponent(id)),
    getBlock: (id) => {
      throw new Error(`Unknown Workbench UI block: ${String(id)}`)
    },
    getBlocks: (ids) => createWorkbenchUIBulkResult(ids, (id) => base.getBlock(id)),
    getIcon: () => undefined,
  }

  return Object.assign(base, overrides)
}

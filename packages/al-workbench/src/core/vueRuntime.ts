import { getIcon } from '@activelane/icons'
import { markRaw, reactive, watch } from 'vue'
import { workbenchBlockRegistry, workbenchComponentRegistry } from '../ui/registry'
import { createExtensionRuntime } from './runtime/createExtensionRuntime'
import type { CreateWorkbenchRuntimeOptions, WorkbenchRuntimeApi } from './runtime/types'
import {
  createWorkbenchUIBulkResult,
  type WorkbenchBlockId,
  type WorkbenchComponentId,
  type WorkbenchIcon,
  type WorkbenchUI,
} from './workbench/ui'

function markVueRaw<T>(value: T): T {
  return value && (typeof value === 'object' || typeof value === 'function')
    ? (markRaw(value as object) as T)
    : value
}

export function createVueWorkbenchUI(overrides: Partial<WorkbenchUI> = {}): Partial<WorkbenchUI> {
  const components = Object.fromEntries(
    Object.entries(workbenchComponentRegistry).map(([id, component]) => [id, markRaw(component)]),
  ) as typeof workbenchComponentRegistry
  const blocks = Object.fromEntries(
    Object.entries(workbenchBlockRegistry).map(([id, block]) => [id, markRaw(block)]),
  ) as typeof workbenchBlockRegistry
  const component = <K extends WorkbenchComponentId>(id: K) => {
    const value = components[id]
    if (!value) throw new Error(`Unknown Workbench UI component: ${String(id)}`)
    return value
  }
  const block = <K extends WorkbenchBlockId>(id: K) => {
    const value = blocks[id]
    if (!value) throw new Error(`Unknown Workbench UI block: ${String(id)}`)
    return value
  }

  const ui: WorkbenchUI = {
    getComponent: component,
    getComponents: (ids) => createWorkbenchUIBulkResult(ids, component),
    getBlock: block,
    getBlocks: (ids) => createWorkbenchUIBulkResult(ids, block),
    getIcon: (name) => getIcon(name) as WorkbenchIcon | undefined,
  }

  return { ...ui, ...overrides }
}

export function createVueExtensionRuntime(
  options: CreateWorkbenchRuntimeOptions,
): Promise<WorkbenchRuntimeApi> {
  return createExtensionRuntime({
    ...options,
    reactivity: {
      reactive: (value) => reactive(value) as typeof value,
      markRaw: markVueRaw,
      watch(source, callback, watchOptions) {
        const stop = watch(source, callback, watchOptions)
        return { dispose: stop }
      },
      ...options.reactivity,
    },
    ui: createVueWorkbenchUI(options.ui),
  })
}

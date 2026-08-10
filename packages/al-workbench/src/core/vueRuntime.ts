import { getIcon } from '@activelane/icons'
import { type Component, defineAsyncComponent, markRaw, reactive, watch } from 'vue'
import { createExtensionRuntime } from './runtime/createExtensionRuntime'
import type { CreateWorkbenchRuntimeOptions, WorkbenchRuntimeApi } from './runtime/types'
import {
  createWorkbenchUIBulkResult,
  type WorkbenchComponent,
  type WorkbenchIcon,
  type WorkbenchUI,
} from './workbench/ui'

type ShadcnName = string

function markVueRaw<T>(value: T): T {
  return value && (typeof value === 'object' || typeof value === 'function')
    ? (markRaw(value as object) as T)
    : value
}

export function getVueComponent<N extends ShadcnName>(name: N): WorkbenchComponent {
  return markRaw(
    defineAsyncComponent(async () => {
      const module = (await import('@activelane/shadcn')) as unknown as Record<string, Component>
      return module[name] as Component
    }),
  ) as WorkbenchComponent
}

export function getVueComponents<const NS extends readonly ShadcnName[]>(names: NS) {
  return createWorkbenchUIBulkResult(names, (name) => getVueComponent(name))
}

export function createVueWorkbenchUI(overrides: Partial<WorkbenchUI> = {}): Partial<WorkbenchUI> {
  const getComponentsForWorkbench: WorkbenchUI['getComponents'] = (names) =>
    createWorkbenchUIBulkResult(names, (name) => getVueComponent(name as ShadcnName))

  return {
    getComponent: (name) => getVueComponent(name as ShadcnName),
    getComponents: getComponentsForWorkbench,
    getIcon: (name) => getIcon(name) as WorkbenchIcon | undefined,
    getIcons: (names) =>
      createWorkbenchUIBulkResult(names, (name) => getIcon(name) as WorkbenchIcon | undefined),
    ...overrides,
  }
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

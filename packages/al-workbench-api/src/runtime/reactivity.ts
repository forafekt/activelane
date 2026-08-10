import type { Disposable } from '../shared/types'

export interface WorkbenchWatchOptions {
  deep?: boolean
}

export interface WorkbenchReactivityAdapter {
  reactive: <T extends object>(value: T) => T
  markRaw: <T>(value: T) => T
  watch?: (
    source: () => unknown,
    callback: () => void,
    options?: WorkbenchWatchOptions,
  ) => Disposable
}

export const defaultWorkbenchReactivity: WorkbenchReactivityAdapter = {
  reactive: (value) => value,
  markRaw: (value) => value,
}

export function resolveWorkbenchReactivity(
  adapter?: Partial<WorkbenchReactivityAdapter>,
): WorkbenchReactivityAdapter {
  return {
    reactive: adapter?.reactive ?? defaultWorkbenchReactivity.reactive,
    markRaw: adapter?.markRaw ?? defaultWorkbenchReactivity.markRaw,
    watch: adapter?.watch,
  }
}

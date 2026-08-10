import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

export const WORKBENCH_RUNTIME_SYMBOL: InjectionKey<WorkbenchRuntimeApi> = Symbol(
  'WORKBENCH_RUNTIME_SYMBOL',
)

export function provideWorkbenchRuntime(runtime: WorkbenchRuntimeApi) {
  provide(WORKBENCH_RUNTIME_SYMBOL, runtime)
}

export function useWorkbenchRuntime() {
  const runtime = inject(WORKBENCH_RUNTIME_SYMBOL, null)
  if (!runtime) throw new Error('Workbench runtime was not provided.')
  return runtime
}

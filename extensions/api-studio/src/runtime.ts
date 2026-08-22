import type { ApiStudioStore } from './store'

let activeStore: ApiStudioStore | undefined

export function provideApiStudioStore(store: ApiStudioStore) {
  activeStore = store
}
export function useApiStudioStore() {
  if (!activeStore) throw new Error('API Studio has not been activated.')
  return activeStore
}

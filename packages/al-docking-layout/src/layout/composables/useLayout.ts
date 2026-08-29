import { inject } from 'vue'
import { layoutStoreKey } from '../core/store'

export function useLayout() {
  const store = inject(layoutStoreKey)
  if (!store) throw new Error('useLayout must be used inside LayoutRoot')
  return store
}

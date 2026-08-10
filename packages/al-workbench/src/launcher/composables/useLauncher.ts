import { inject, provide } from 'vue'
import type { ApplicationRegistryService } from '../types'
import { LAUNCHER_SERVICE_SYMBOL } from '../types'

export function provideLauncher(service: ApplicationRegistryService) {
  provide(LAUNCHER_SERVICE_SYMBOL, service)
  return service
}

export function useLauncher() {
  const service = inject(LAUNCHER_SERVICE_SYMBOL)
  if (!service) throw new Error('ActiveLane launcher service was not provided.')
  return service
}

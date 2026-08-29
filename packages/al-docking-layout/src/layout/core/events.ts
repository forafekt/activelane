import type { LayoutEventMap, LayoutEventName } from './types'

export class LayoutEvents {
  private listeners = new Map<LayoutEventName, Set<(payload: never) => void>>()
  on<K extends LayoutEventName>(name: K, listener: (payload: LayoutEventMap[K]) => void) {
    const listeners = this.listeners.get(name) ?? new Set()
    listeners.add(listener as (payload: never) => void)
    this.listeners.set(name, listeners)
    return () => listeners.delete(listener as (payload: never) => void)
  }
  emit<K extends LayoutEventName>(name: K, payload: LayoutEventMap[K]) {
    this.listeners.get(name)?.forEach((listener) => {
      listener(payload as never)
    })
  }
}

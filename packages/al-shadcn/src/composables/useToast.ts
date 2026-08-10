import { computed, readonly, ref } from 'vue'
import type { Tone } from '../types'

export interface ToastItem {
  id: number
  title: string
  description?: string
  tone?: Tone
  duration?: number
}

const toasts = ref<ToastItem[]>([])
let nextToastId = 1
const timeoutMap = new Map<number, number>()

export function useToast() {
  function remove(id: number) {
    const timeoutId = timeoutMap.get(id)
    if (timeoutId && typeof window !== 'undefined') {
      window.clearTimeout(timeoutId)
      timeoutMap.delete(id)
    }

    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(toast: Omit<ToastItem, 'id'>) {
    const item: ToastItem = {
      id: nextToastId++,
      tone: 'neutral',
      duration: 3400,
      ...toast,
    }

    toasts.value = [...toasts.value, item]
    if (typeof window !== 'undefined' && item.duration && item.duration > 0) {
      const timeoutId = window.setTimeout(() => remove(item.id), item.duration)
      timeoutMap.set(item.id, timeoutId)
    }

    return item.id
  }

  function clear() {
    if (typeof window !== 'undefined') {
      timeoutMap.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
    }
    timeoutMap.clear()
    toasts.value = []
  }

  return {
    toasts: readonly(computed(() => toasts.value)),
    push,
    remove,
    clear,
  }
}

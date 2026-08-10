import { computed, ref } from 'vue'

export function useRovingSelection<T extends { id: string }>(items: () => T[], initialId?: string) {
  const activeId = ref<string | null>(initialId ?? null)
  const activeIndex = computed(() => items().findIndex((item) => item.id === activeId.value))

  function move(delta: number) {
    const list = items().filter(Boolean)
    if (!list.length) return null
    const current = activeIndex.value < 0 ? 0 : activeIndex.value
    const next = (current + delta + list.length) % list.length
    activeId.value = list[next]?.id ?? null
    return list[next] ?? null
  }

  function first() {
    activeId.value = items()[0]?.id ?? null
  }

  function last() {
    const list = items()
    activeId.value = list.at(-1)?.id ?? null
  }

  return { activeId, activeIndex, move, first, last }
}

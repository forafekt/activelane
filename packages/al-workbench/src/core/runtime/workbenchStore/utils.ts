export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}:${crypto.randomUUID()}`
  }
  return `${prefix}:${Math.random().toString(36).slice(2, 10)}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

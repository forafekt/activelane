import { usePreferredDark, useStorage } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import type { ThemeMode } from '../tokens'

export const THEME_STORAGE_KEY = 'activelane-ui-theme'
export const THEME_MODES = ['system', 'light', 'dark', 'high-contrast'] as const
export const activeLaneThemeNames = {
  light: 'light',
  dark: 'dark',
  highContrast: 'high-contrast',
} as const

export interface ThemeOptions {
  storageKey?: string
  target?: HTMLElement | null
}

let initialized = false

export function initializeTheme(defaultTheme: ThemeMode = 'system') {
  if (initialized || typeof document === 'undefined') return

  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null
  const mode: ThemeMode =
    stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'high-contrast'
      ? stored
      : defaultTheme
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
  root.classList.toggle('high-contrast', resolved === 'high-contrast')
  root.dataset.theme = resolved
  root.dataset.themeMode = mode
  root.style.colorScheme = resolved === 'light' ? 'light' : 'dark'
  initialized = true
}

export function useTheme(options: ThemeOptions = {}) {
  const storageKey = options.storageKey ?? THEME_STORAGE_KEY
  const preferredDark = usePreferredDark()
  const mode = useStorage<ThemeMode>(storageKey, 'system')
  const resolvedMode = computed<'light' | 'dark' | 'high-contrast'>(() =>
    mode.value === 'system' ? (preferredDark.value ? 'dark' : 'light') : mode.value,
  )

  watchEffect(() => {
    const target = options.target ?? document.documentElement
    target.classList.toggle('dark', resolvedMode.value === 'dark')
    target.classList.toggle('light', resolvedMode.value === 'light')
    target.classList.toggle('high-contrast', resolvedMode.value === 'high-contrast')
    target.dataset.theme = resolvedMode.value
    target.dataset.themeMode = mode.value
    target.style.colorScheme = resolvedMode.value === 'light' ? 'light' : 'dark'
  })

  return {
    mode,
    resolvedMode,
    setTheme(value: ThemeMode) {
      mode.value = value
    },
  }
}

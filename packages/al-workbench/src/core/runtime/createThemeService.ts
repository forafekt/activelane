import type { WorkbenchStorageScope } from '../host/types'
import type { Disposable } from '../shared/types'
import type {
  WorkbenchThemeChangeEvent,
  WorkbenchThemeContribution,
  WorkbenchThemePreference,
  WorkbenchThemeService,
} from '../workbench/themes'
import { resolveWorkbenchReactivity, type WorkbenchReactivityAdapter } from './reactivity'

export const WORKBENCH_THEME_STORAGE_KEY = 'theme-preference'

type Listener = (event: WorkbenchThemeChangeEvent) => void

const PREFERENCE_TO_THEME_ID = {
  light: 'activelane.light',
  dark: 'activelane.dark',
  'high-contrast': 'activelane.high-contrast',
} as const

function toCssVariableName(token: string) {
  return `--${token
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/\./g, '-')}`
}

function isThemePreference(value: unknown): value is WorkbenchThemePreference {
  return typeof value === 'string' && value.length > 0
}

function readSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export async function createThemeService(
  storage: WorkbenchStorageScope,
  reactivity?: Partial<WorkbenchReactivityAdapter>,
): Promise<WorkbenchThemeService> {
  const reactive = resolveWorkbenchReactivity(reactivity).reactive
  const themes = reactive<WorkbenchThemeContribution[]>([])
  const listeners = new Set<Listener>()
  const persistedPreference = await storage.get<WorkbenchThemePreference>(
    WORKBENCH_THEME_STORAGE_KEY,
  )
  let preference: WorkbenchThemePreference = isThemePreference(persistedPreference)
    ? persistedPreference
    : 'system'
  let systemTheme: 'light' | 'dark' = readSystemTheme()
  let activeThemeId: string | undefined

  function resolvePreference(nextPreference: WorkbenchThemePreference = preference) {
    if (nextPreference === 'system') return PREFERENCE_TO_THEME_ID[systemTheme]
    if (nextPreference === 'light') return PREFERENCE_TO_THEME_ID.light
    if (nextPreference === 'dark') return PREFERENCE_TO_THEME_ID.dark
    if (nextPreference === 'high-contrast') return PREFERENCE_TO_THEME_ID['high-contrast']
    return nextPreference
  }

  function emit() {
    const activeTheme = activeThemeId
      ? themes.find((theme) => theme.id === activeThemeId)
      : undefined
    listeners.forEach((listener) => {
      listener({
        preference,
        activeTheme,
        resolvedThemeId: activeThemeId,
        systemTheme,
      })
    })
  }

  function apply(themeId: string) {
    const theme = themes.find((item) => item.id === themeId)
    if (!theme) return

    activeThemeId = theme.id

    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('light', theme.type === 'light')
      root.classList.toggle('dark', theme.type === 'dark')
      root.classList.toggle('high-contrast', theme.type === 'high-contrast')
      root.dataset.theme = theme.type
      root.dataset.themeId = theme.id
      root.dataset.themePreference = preference
      root.dataset.themeMode = theme.type
      root.style.colorScheme = theme.type === 'light' ? 'light' : 'dark'

      for (const [token, value] of Object.entries({ ...theme.tokens, ...theme.semanticTokens })) {
        root.style.setProperty(toCssVariableName(token), value)
      }
    }

    emit()
  }

  function applyPreference() {
    const themeId = resolvePreference()
    if (themeId) apply(themeId)
  }

  if (typeof window !== 'undefined') {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      const nextSystemTheme = readSystemTheme()
      if (nextSystemTheme === systemTheme) return
      systemTheme = nextSystemTheme
      if (preference === 'system') applyPreference()
      else emit()
    }
    media.addEventListener?.('change', handleSystemChange)
  }

  return {
    list() {
      return themes.slice().sort((left, right) => left.label.localeCompare(right.label))
    },
    get(themeId) {
      return themes.find((theme) => theme.id === themeId)
    },
    getPreference() {
      return preference
    },
    getActiveTheme() {
      return activeThemeId ? themes.find((theme) => theme.id === activeThemeId) : undefined
    },
    getSystemTheme() {
      return systemTheme
    },
    resolvePreference,
    async setPreference(nextPreference) {
      preference = nextPreference
      await storage.set(WORKBENCH_THEME_STORAGE_KEY, preference)
      applyPreference()
    },
    async setActiveTheme(themeId) {
      const theme = themes.find((item) => item.id === themeId)
      if (!theme) return
      preference =
        themeId === PREFERENCE_TO_THEME_ID.light
          ? 'light'
          : themeId === PREFERENCE_TO_THEME_ID.dark
            ? 'dark'
            : themeId === PREFERENCE_TO_THEME_ID['high-contrast']
              ? 'high-contrast'
              : themeId
      await storage.set(WORKBENCH_THEME_STORAGE_KEY, preference)
      apply(themeId)
    },
    register(ownerExtensionId, nextThemes) {
      const ownedThemes = nextThemes.map((theme) => ({
        ...theme,
        ownerExtensionId: theme.ownerExtensionId ?? ownerExtensionId,
      }))
      for (const theme of ownedThemes) {
        const existing = themes.findIndex((item) => item.id === theme.id)
        if (existing >= 0) themes.splice(existing, 1, theme)
        else themes.push(theme)
      }
      applyPreference()

      return {
        dispose() {
          for (const theme of ownedThemes) {
            const index = themes.findIndex(
              (item) => item.id === theme.id && item.ownerExtensionId === ownerExtensionId,
            )
            if (index >= 0) themes.splice(index, 1)
          }
          applyPreference()
        },
      } satisfies Disposable
    },
    apply,
    onDidChange(listener) {
      listeners.add(listener)
      return {
        dispose() {
          listeners.delete(listener)
        },
      }
    },
  }
}

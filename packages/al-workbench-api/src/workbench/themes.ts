import type { Disposable } from '../shared/types'

export type WorkbenchThemeTokenName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'success'
  | 'successForeground'
  | 'warning'
  | 'warningForeground'
  | 'border'
  | 'input'
  | 'ring'
  | 'chart1'
  | 'chart2'
  | 'chart3'
  | 'chart4'
  | 'chart5'
  | 'radius'
  | 'sidebar'
  | 'sidebarForeground'
  | 'sidebarPrimary'
  | 'sidebarPrimaryForeground'
  | 'sidebarAccent'
  | 'sidebarAccentForeground'
  | 'sidebarBorder'
  | 'sidebarRing'

export type WorkbenchThemeTokens = Partial<Record<WorkbenchThemeTokenName, string>> &
  Record<string, string>

export interface WorkbenchThemeContribution {
  id: string
  label: string
  type: 'light' | 'dark' | 'high-contrast'
  description?: string
  tokens: WorkbenchThemeTokens
  semanticTokens?: WorkbenchThemeTokens
  ownerExtensionId?: string
}

export type WorkbenchThemePreference = 'system' | 'light' | 'dark' | 'high-contrast' | (string & {})

export interface WorkbenchThemeChangeEvent {
  preference: WorkbenchThemePreference
  activeTheme: WorkbenchThemeContribution | undefined
  resolvedThemeId: string | undefined
  systemTheme: 'light' | 'dark'
}

export interface WorkbenchThemeService {
  list: () => WorkbenchThemeContribution[]
  get: (themeId: string) => WorkbenchThemeContribution | undefined
  getPreference: () => WorkbenchThemePreference
  getActiveTheme: () => WorkbenchThemeContribution | undefined
  getSystemTheme: () => 'light' | 'dark'
  resolvePreference: (preference?: WorkbenchThemePreference) => string | undefined
  setPreference: (preference: WorkbenchThemePreference) => Promise<void>
  setActiveTheme: (themeId: string) => Promise<void>
  register: (ownerExtensionId: string, themes: WorkbenchThemeContribution[]) => Disposable
  apply: (themeId: string) => void
  onDidChange: (listener: (event: WorkbenchThemeChangeEvent) => void) => Disposable
}

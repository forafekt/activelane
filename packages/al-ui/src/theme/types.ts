import type { Ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast'
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>
export type Density = 'compact' | 'comfortable'

export interface UiThemeTokens {
  colors: {
    canvas: string
    surface: string
    elevated: string
    subtle: string
    border: string
    text: string
    textMuted: string
    primary: string
    primaryHover: string
    primaryPressed: string
    focus: string
    selected: string
    success: string
    warning: string
    error: string
    info: string
  }
  typography: { family: string; monoFamily: string; fontSize: string; lineHeight: string }
  radius: { small: string; medium: string; large: string }
  shadow: { overlay: string; floating: string }
  motion: { fast: string; normal: string }
  layers: { dropdown: number; modal: number; notification: number; tooltip: number }
}

export interface UiThemePreset {
  id: string
  label: string
  mode: ResolvedThemeMode
  tokens: UiThemeTokens
}
export type MaybeRef<T> = T | Ref<T>

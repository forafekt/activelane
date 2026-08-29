import type { UiThemePreset, UiThemeTokens } from './types'

const base: Omit<UiThemeTokens, 'colors'> = {
  typography: {
    family: 'Inter, ui-sans-serif, system-ui, sans-serif',
    monoFamily: '"SFMono-Regular", Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.45',
  },
  radius: { small: '3px', medium: '5px', large: '7px' },
  shadow: { overlay: '0 8px 24px rgb(0 0 0 / 18%)', floating: '0 2px 8px rgb(0 0 0 / 12%)' },
  motion: { fast: '120ms', normal: '180ms' },
  layers: { dropdown: 2000, modal: 3000, notification: 4000, tooltip: 5000 },
}

export const lightTheme: UiThemePreset = {
  id: 'activelane-light',
  label: 'ActiveLane Light',
  mode: 'light',
  tokens: {
    ...base,
    colors: {
      canvas: '#f5f6f8',
      surface: '#ffffff',
      elevated: '#ffffff',
      subtle: '#f0f2f5',
      border: '#d9dde4',
      text: '#1d2430',
      textMuted: '#687386',
      primary: '#356ae6',
      primaryHover: '#285bd1',
      primaryPressed: '#214cae',
      focus: '#4c7ff0',
      selected: '#e8efff',
      success: '#23845b',
      warning: '#a86208',
      error: '#c33c45',
      info: '#2d6ccf',
    },
  },
}

export const darkTheme: UiThemePreset = {
  id: 'activelane-dark',
  label: 'ActiveLane Dark',
  mode: 'dark',
  tokens: {
    ...base,
    shadow: { overlay: '0 10px 28px rgb(0 0 0 / 48%)', floating: '0 2px 10px rgb(0 0 0 / 36%)' },
    colors: {
      canvas: '#15181e',
      surface: '#1c2027',
      elevated: '#242a33',
      subtle: '#20252d',
      border: '#343b47',
      text: '#e7eaf0',
      textMuted: '#9aa4b3',
      primary: '#7aa2ff',
      primaryHover: '#91b2ff',
      primaryPressed: '#638eea',
      focus: '#7aa2ff',
      selected: '#26395f',
      success: '#54b88a',
      warning: '#dfa650',
      error: '#ee7279',
      info: '#77a7f5',
    },
  },
}

export const highContrastTheme: UiThemePreset = {
  id: 'activelane-high-contrast',
  label: 'ActiveLane High Contrast',
  mode: 'high-contrast',
  tokens: {
    ...darkTheme.tokens,
    colors: {
      ...darkTheme.tokens.colors,
      canvas: '#000000',
      surface: '#080808',
      elevated: '#111111',
      border: '#ffffff',
      text: '#ffffff',
      textMuted: '#d6d6d6',
      primary: '#8db4ff',
      focus: '#ffde59',
      selected: '#163b78',
    },
  },
}

export const themePresets = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
} as const

import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type { WorkbenchExtensionDefinition } from '../core/extensions/types'
import type { WorkbenchThemeContribution } from '../core/workbench/themes'

type ThemeTokens = WorkbenchThemeContribution['tokens']

const lightWorkbenchSemanticTokens = {
  surface: 'oklch(0.982 0 0)',
  surfaceRaised: 'oklch(1 0 0 / 0.92)',
  surfaceOverlay: 'oklch(1 0 0 / 0.86)',
  subtleBorder: 'oklch(0.89 0 0)',
  textPrimary: 'oklch(0.18 0 0)',
  textMuted: 'oklch(0.5 0 0)',
  focusRing: 'oklch(0.56 0.12 245)',
  activity: 'oklch(0.955 0 0)',
  sidebarSurface: 'oklch(0.972 0 0)',
  editorSurface: 'oklch(0.997 0 0)',
  terminalSurface: 'oklch(0.17 0 0)',
  panelSurface: 'oklch(0.965 0 0)',
  tabActive: 'oklch(1 0 0)',
  titlebar: 'oklch(0.955 0 0 / 0.88)',
  titlebarInactive: 'oklch(0.94 0 0 / 0.74)',
  hoverSurface: 'oklch(0.935 0 0)',
  selectedSurface: 'oklch(0.9 0.015 245)',
  dragSurface: 'oklch(0.85 0.025 245 / 0.55)',
  previewSurface: 'oklch(0.965 0 0 / 0.76)',
  dirty: 'oklch(0.61 0.12 70)',
  error: 'oklch(0.55 0.22 25)',
  elevation1: '0 1px 2px oklch(0 0 0 / 0.08), 0 1px 0 oklch(1 0 0 / 0.65) inset',
  elevation2: '0 10px 28px oklch(0 0 0 / 0.14), 0 1px 0 oklch(1 0 0 / 0.72) inset',
  elevationOverlay: '0 22px 60px oklch(0 0 0 / 0.22)',
} satisfies ThemeTokens

const darkWorkbenchSemanticTokens = {
  surface: 'oklch(0.215 0 0)',
  surfaceRaised: 'oklch(0.255 0 0 / 0.86)',
  surfaceOverlay: 'oklch(0.285 0 0 / 0.9)',
  subtleBorder: 'oklch(0.33 0 0)',
  textPrimary: 'oklch(0.9 0 0)',
  textMuted: 'oklch(0.67 0 0)',
  focusRing: 'oklch(0.67 0.12 245)',
  activity: 'oklch(0.18 0 0)',
  sidebarSurface: 'oklch(0.2 0 0)',
  editorSurface: 'oklch(0.235 0 0)',
  terminalSurface: 'oklch(0.15 0 0)',
  panelSurface: 'oklch(0.205 0 0)',
  tabActive: 'oklch(0.265 0 0)',
  titlebar: 'oklch(0.19 0 0 / 0.9)',
  titlebarInactive: 'oklch(0.18 0 0 / 0.76)',
  hoverSurface: 'oklch(0.31 0 0)',
  selectedSurface: 'oklch(0.36 0.025 245)',
  dragSurface: 'oklch(0.45 0.04 245 / 0.46)',
  previewSurface: 'oklch(0.24 0 0 / 0.68)',
  dirty: 'oklch(0.77 0.13 75)',
  error: 'oklch(0.67 0.23 25)',
  elevation1: '0 1px 2px oklch(0 0 0 / 0.32), 0 1px 0 oklch(1 0 0 / 0.04) inset',
  elevation2: '0 12px 32px oklch(0 0 0 / 0.42), 0 1px 0 oklch(1 0 0 / 0.05) inset',
  elevationOverlay: '0 24px 72px oklch(0 0 0 / 0.52)',
} satisfies ThemeTokens

const highContrastWorkbenchSemanticTokens = {
  ...darkWorkbenchSemanticTokens,
  surface: 'oklch(0.04 0 0)',
  surfaceRaised: 'oklch(0.08 0 0)',
  surfaceOverlay: 'oklch(0.02 0 0)',
  subtleBorder: 'oklch(1 0 0)',
  focusRing: 'oklch(0.92 0.2 95)',
  selectedSurface: 'oklch(0.26 0.08 250)',
  titlebar: 'oklch(0.02 0 0)',
} satisfies ThemeTokens

const lightTokens = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',
  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.145 0 0)',
  primary: 'oklch(0.205 0 0)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.97 0 0)',
  secondaryForeground: 'oklch(0.205 0 0)',
  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.556 0 0)',
  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
  success: 'oklch(70% 0.13 145)',
  successForeground: 'oklch(17.3% 0 0)',
  warning: 'oklch(76% 0.12 80)',
  warningForeground: 'oklch(17.3% 0 0)',
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',
  chart1: 'oklch(0.87 0 0)',
  chart2: 'oklch(0.556 0 0)',
  chart3: 'oklch(0.439 0 0)',
  chart4: 'oklch(0.371 0 0)',
  chart5: 'oklch(0.269 0 0)',
  radius: '0.625rem',
  sidebar: 'oklch(0.985 0 0)',
  sidebarForeground: 'oklch(0.145 0 0)',
  sidebarPrimary: 'oklch(0.205 0 0)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.97 0 0)',
  sidebarAccentForeground: 'oklch(0.205 0 0)',
  sidebarBorder: 'oklch(0.922 0 0)',
  sidebarRing: 'oklch(0.708 0 0)',
} satisfies ThemeTokens

const darkTokens = {
  background: 'oklch(0.235 0 0)',
  foreground: 'oklch(0.865 0 0)',

  card: 'oklch(0.27 0 0)',
  cardForeground: 'oklch(0.84 0 0)',

  popover: 'oklch(0.27 0 0)',
  popoverForeground: 'oklch(0.84 0 0)',

  primary: 'oklch(0.922 0 0)',
  primaryForeground: 'oklch(0.205 0 0)',

  secondary: 'oklch(0.305 0 0)',
  secondaryForeground: 'oklch(0.84 0 0)',

  muted: 'oklch(0.305 0 0)',
  mutedForeground: 'oklch(0.62 0 0)',

  accent: 'oklch(0.34 0.01 280)',
  accentForeground: 'oklch(1 0 0)',

  destructive: 'oklch(0.64 0.22 25)',
  destructiveForeground: 'oklch(1 0 0)',

  success: 'oklch(0.8 0.14 145)',
  successForeground: 'oklch(0.28 0.04 145)',

  warning: 'oklch(0.74 0.16 95)',
  warningForeground: 'oklch(0.235 0 0)',

  border: 'oklch(0.38 0 0)',
  input: 'oklch(0.38 0 0)',

  ring: 'oklch(0.64 0.11 245)',

  chart1: 'oklch(0.7 0.11 245)',
  chart2: 'oklch(0.78 0.11 185)',
  chart3: 'oklch(0.88 0.08 105)',
  chart4: 'oklch(0.72 0.14 320)',
  chart5: 'oklch(0.72 0.11 40)',

  radius: '0.5rem',

  sidebar: 'oklch(0.21 0 0)',
  sidebarForeground: 'oklch(0.84 0 0)',

  sidebarPrimary: 'oklch(0.57 0.16 248)',
  sidebarPrimaryForeground: 'oklch(1 0 0)',

  sidebarAccent: 'oklch(0.31 0.01 240)',
  sidebarAccentForeground: 'oklch(1 0 0)',

  sidebarBorder: 'oklch(0.29 0 0)',
  sidebarRing: 'oklch(0.64 0.11 245)',
} satisfies ThemeTokens

const highContrastTokens = {
  background: 'oklch(0 0 0)',
  foreground: 'oklch(1 0 0)',
  card: 'oklch(0.08 0 0)',
  cardForeground: 'oklch(1 0 0)',
  popover: 'oklch(0.04 0 0)',
  popoverForeground: 'oklch(1 0 0)',
  primary: 'oklch(0.92 0.19 101)',
  primaryForeground: 'oklch(0 0 0)',
  secondary: 'oklch(0.18 0 0)',
  secondaryForeground: 'oklch(1 0 0)',
  muted: 'oklch(0.16 0 0)',
  mutedForeground: 'oklch(0.89 0 0)',
  accent: 'oklch(0.78 0.18 250)',
  accentForeground: 'oklch(0 0 0)',
  destructive: 'oklch(0.68 0.27 25)',
  success: 'oklch(0.82 0.22 145)',
  successForeground: 'oklch(0 0 0)',
  warning: 'oklch(0.92 0.2 95)',
  warningForeground: 'oklch(0 0 0)',
  border: 'oklch(1 0 0)',
  input: 'oklch(0.28 0 0)',
  ring: 'oklch(0.92 0.2 95)',
  chart1: 'oklch(0.92 0.2 95)',
  chart2: 'oklch(0.78 0.18 250)',
  chart3: 'oklch(0.82 0.22 145)',
  chart4: 'oklch(0.72 0.24 330)',
  chart5: 'oklch(0.72 0.26 25)',
  radius: '0.375rem',
  sidebar: 'oklch(0.04 0 0)',
  sidebarForeground: 'oklch(1 0 0)',
  sidebarPrimary: 'oklch(0.92 0.19 101)',
  sidebarPrimaryForeground: 'oklch(0 0 0)',
  sidebarAccent: 'oklch(0.18 0 0)',
  sidebarAccentForeground: 'oklch(1 0 0)',
  sidebarBorder: 'oklch(1 0 0)',
  sidebarRing: 'oklch(0.92 0.2 95)',
} satisfies ThemeTokens

const vscodeDarkTokens = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  card: '#252526',
  cardForeground: '#cccccc',
  popover: '#252526',
  popoverForeground: '#cccccc',
  primary: '#007acc',
  primaryForeground: '#1e1e1e',
  secondary: '#2d2d2d',
  secondaryForeground: '#cccccc',
  muted: '#2d2d2d',
  mutedForeground: '#858585',
  accent: '#37373d',
  accentForeground: '#ffffff',
  destructive: '#f14c4c',
  destructiveForeground: '#ffffff',
  success: '#89d185',
  successForeground: '#102a13',
  warning: '#cca700',
  warningForeground: '#1e1e1e',
  border: '#3c3c3c',
  input: '#3c3c3c',
  ring: '#4b8bbe',
  chart1: '#569cd6',
  chart2: '#4ec9b0',
  chart3: '#dcdcaa',
  chart4: '#c586c0',
  chart5: '#ce9178',
  radius: '0.5rem',
  sidebar: '#181818',
  sidebarForeground: '#cccccc',
  sidebarPrimary: '#007acc',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#2a2d2e',
  sidebarAccentForeground: '#ffffff',
  sidebarBorder: '#2b2b2b',
  sidebarRing: '#4b8bbe',
} satisfies ThemeTokens

function createThemeExtension(options: {
  id: string
  name: string
  displayName: string
  description: string
  builtin: boolean
  theme: WorkbenchThemeContribution
}): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: options.id,
      name: options.name,
      displayName: options.displayName,
      version: '0.1.0',
      description: options.description,
      builtin: options.builtin,
      categories: ['themes', 'workbench'],
      keywords: ['theme', options.theme.type],
      activationEvents: ['onStartup'],
      contributes: {
        themes: [options.theme],
        marketplace: {
          categories: ['themes'],
          featured: options.builtin,
          keywords: ['theme', options.theme.type],
          longDescription: options.description,
        },
      },
    },
  })
}

export function createActiveLaneLightThemeExtension() {
  return createThemeExtension({
    id: 'activelane.theme-light',
    name: 'theme-light',
    displayName: 'ActiveLane Light',
    description: 'Default light theme for ActiveLane.',
    builtin: true,
    theme: {
      id: 'activelane.light',
      label: 'ActiveLane Light',
      type: 'light',
      description: 'Default light theme for ActiveLane.',
      tokens: lightTokens,
      semanticTokens: lightWorkbenchSemanticTokens,
    },
  })
}

export function createActiveLaneDarkThemeExtension() {
  return createThemeExtension({
    id: 'activelane.theme-dark',
    name: 'theme-dark',
    displayName: 'ActiveLane Dark',
    description: 'Default dark theme for ActiveLane.',
    builtin: true,
    theme: {
      id: 'activelane.dark',
      label: 'ActiveLane Dark',
      type: 'dark',
      description: 'Default dark theme for ActiveLane.',
      tokens: darkTokens,
      semanticTokens: darkWorkbenchSemanticTokens,
    },
  })
}

export function createActiveLaneHighContrastThemeExtension() {
  return createThemeExtension({
    id: 'activelane.theme-high-contrast',
    name: 'theme-high-contrast',
    displayName: 'ActiveLane High Contrast',
    description: 'High contrast theme for accessible, strongly separated workbench surfaces.',
    builtin: true,
    theme: {
      id: 'activelane.high-contrast',
      label: 'ActiveLane High Contrast',
      type: 'high-contrast',
      description: 'High contrast theme for accessible, strongly separated workbench surfaces.',
      tokens: highContrastTokens,
      semanticTokens: highContrastWorkbenchSemanticTokens,
    },
  })
}

export function createActiveLaneVSCodeDarkThemeExtension() {
  return createThemeExtension({
    id: 'activelane.theme-vscode-dark',
    name: 'theme-vscode-dark',
    displayName: 'ActiveLane VSCode Dark',
    description: 'VSCode Dark-inspired theme for focused developer workbench surfaces.',
    builtin: true,
    theme: {
      id: 'activelane.vscode.dark',
      label: 'ActiveLane VSCode Dark',
      type: 'dark',
      description: 'VSCode Dark-inspired theme for focused developer workbench surfaces.',
      tokens: vscodeDarkTokens,
      semanticTokens: {
        ...darkWorkbenchSemanticTokens,
        surface: '#1b1b1b',
        surfaceRaised: 'rgb(42 42 42 / 0.88)',
        surfaceOverlay: 'rgb(48 48 48 / 0.9)',
        subtleBorder: '#333333',
        focusRing: '#4b8bbe',
        activity: '#181818',
        sidebarSurface: '#1a1a1a',
        editorSurface: '#1e1e1e',
        panelSurface: '#202020',
        tabActive: '#252526',
        selectedSurface: 'rgb(55 65 81 / 0.62)',
        titlebar: 'rgb(24 24 24 / 0.92)',
      },
    },
  })
}

export function createActiveLaneThemeExtensions() {
  return [
    createActiveLaneLightThemeExtension(),
    createActiveLaneDarkThemeExtension(),
    createActiveLaneHighContrastThemeExtension(),
    createActiveLaneVSCodeDarkThemeExtension(),
  ]
}

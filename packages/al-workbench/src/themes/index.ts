import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type { WorkbenchExtensionDefinition } from '../core/extensions/types'
import type { WorkbenchThemeContribution } from '../core/workbench/themes'

type ThemeTokens = WorkbenchThemeContribution['tokens']

const lightWorkbenchSemanticTokens = {
  windowBackground: 'transparent',
  workbenchBackground: 'transparent',
  shellChromeSurface: 'oklch(0.945 0.007 255 / 0.94)',
  paneSurface: 'oklch(0.985 0.003 255)',
  paneSurfaceRaised: 'oklch(1 0 0 / 0.9)',
  paneInset: 'oklch(0.965 0.004 255)',
  toolbarSurface: 'oklch(0.975 0.004 255 / 0.9)',
  tabSurface: 'oklch(0.94 0.005 255)',
  tabHover: 'oklch(0.965 0.008 250)',
  resizeHandle: 'oklch(0.65 0.01 255 / 0.18)',
  resizeHandleActive: 'oklch(0.56 0.12 245 / 0.9)',
  controlHeight: '2rem',
  controlHeightCompact: '1.75rem',
  controlRadius: '0.3125rem',
  controlBorder: 'oklch(0.84 0.006 255)',
  controlSurface: 'oklch(0.99 0.002 255)',
  controlSurfaceHover: 'oklch(0.955 0.006 255)',
  controlSurfacePressed: 'oklch(0.925 0.012 250)',
  focusOutline: 'oklch(0.56 0.12 245 / 0.85)',
  listRowHeight: '1.875rem',
  toolbarHeight: '2.125rem',
  overlayRadius: '0.4375rem',
  shellInset: '0.375rem',
  paneGap: '0.375rem',
  paneRadius: '0.5rem',
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
  windowBackground: 'transparent',
  workbenchBackground: 'transparent',
  shellChromeSurface: 'transparent',
  paneSurface: '#191a1c',
  paneSurfaceRaised: 'rgb(31 33 36 / 0.96)',
  paneInset: '#191a1c',
  toolbarSurface: 'rgb(25 26 28 / 0.96)',
  tabSurface: '#191a1c',
  tabHover: '#25272b',
  resizeHandle: 'rgb(87 91 99 / 0.18)',
  resizeHandleActive: 'rgb(91 143 249 / 0.9)',
  controlHeight: '2rem',
  controlHeightCompact: '1.75rem',
  controlRadius: '0.3125rem',
  controlBorder: '#383b42',
  controlSurface: '#1d1f22',
  controlSurfaceHover: '#282a2f',
  controlSurfacePressed: '#33363d',
  focusOutline: 'rgb(91 141 239 / 0.9)',
  listRowHeight: '1.875rem',
  toolbarHeight: '2.125rem',
  overlayRadius: '0.4375rem',
  shellInset: '0.375rem',
  paneGap: '0.375rem',
  paneRadius: '0.5rem',
  surface: '#191a1c',
  surfaceRaised: 'rgb(31 33 36 / 0.96)',
  surfaceOverlay: 'rgb(38 40 44 / 0.98)',
  subtleBorder: '#303238',
  textPrimary: '#d5d8de',
  textMuted: '#8d939d',
  focusRing: '#5b8def',
  activity: '#26282c',
  sidebarSurface: '#191a1c',
  editorSurface: '#191a1c',
  terminalSurface: '#151618',
  panelSurface: '#191a1c',
  tabActive: '#26282c',
  titlebar: 'rgb(38 40 44 / 0.98)',
  titlebarInactive: 'rgb(34 36 40 / 0.92)',
  hoverSurface: '#292b30',
  selectedSurface: '#33353b',
  dragSurface: 'rgb(42 67 113 / 0.6)',
  previewSurface: 'rgb(38 40 44 / 0.76)',
  dirty: '#d5a442',
  error: '#e85d68',
  elevation1: '0 1px 2px rgb(0 0 0 / 0.34), 0 1px 0 rgb(255 255 255 / 0.025) inset',
  elevation2: '0 10px 28px rgb(0 0 0 / 0.4), 0 1px 0 rgb(255 255 255 / 0.035) inset',
  elevationOverlay: '0 20px 60px rgb(0 0 0 / 0.52)',
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
  windowBackground: 'transparent',
  workbenchBackground: 'transparent',
  shellChromeSurface: 'oklch(0.02 0 0)',
  paneSurface: 'oklch(0.04 0 0)',
  paneSurfaceRaised: 'oklch(0.07 0 0)',
  paneInset: 'oklch(0.02 0 0)',
  toolbarSurface: 'oklch(0.055 0 0)',
  tabSurface: 'oklch(0.025 0 0)',
  tabHover: 'oklch(0.11 0 0)',
  resizeHandle: 'oklch(1 0 0 / 0.34)',
  resizeHandleActive: 'oklch(0.92 0.2 95)',
  shellInset: '0.375rem',
  paneGap: '0.375rem',
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
  background: '#191a1c',
  foreground: '#d5d8de',

  card: '#1f2124',
  cardForeground: '#d5d8de',

  popover: '#26282c',
  popoverForeground: '#dfe2e7',

  primary: '#d5d8de',
  primaryForeground: '#191a1c',

  secondary: '#26282c',
  secondaryForeground: '#d5d8de',

  muted: '#26282c',
  mutedForeground: '#8d939d',

  accent: '#33353b',
  accentForeground: '#f2f4f7',

  destructive: '#e85d68',
  destructiveForeground: '#ffffff',

  success: '#6fbf73',
  successForeground: '#111712',

  warning: '#d5a442',
  warningForeground: '#191a1c',

  border: '#303238',
  input: '#33353b',

  ring: '#5b8def',

  chart1: '#6c9ef8',
  chart2: '#63b6a5',
  chart3: '#d8b96b',
  chart4: '#b38bd4',
  chart5: '#d5896f',

  radius: '0.5rem',

  sidebar: '#191a1c',
  sidebarForeground: '#d5d8de',

  sidebarPrimary: '#2a4371',
  sidebarPrimaryForeground: '#e7edf8',

  sidebarAccent: '#33353b',
  sidebarAccentForeground: '#f2f4f7',

  sidebarBorder: '#303238',
  sidebarRing: '#5b8def',
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

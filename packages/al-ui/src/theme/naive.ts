import { type GlobalThemeOverrides, darkTheme as naiveDarkTheme } from 'naive-ui'
import type { Density, UiThemePreset } from './types'

export function toNaiveTheme(
  preset: UiThemePreset,
  density: Density,
): { theme: typeof naiveDarkTheme | null; overrides: GlobalThemeOverrides } {
  const t = preset.tokens
  const height = density === 'compact' ? '28px' : '34px'
  return {
    theme: preset.mode === 'light' ? null : naiveDarkTheme,
    overrides: {
      common: {
        fontFamily: t.typography.family,
        fontFamilyMono: t.typography.monoFamily,
        fontSize: t.typography.fontSize,
        bodyColor: t.colors.canvas,
        cardColor: t.colors.surface,
        modalColor: t.colors.elevated,
        popoverColor: t.colors.elevated,
        textColorBase: t.colors.text,
        textColor1: t.colors.text,
        textColor2: t.colors.textMuted,
        borderColor: t.colors.border,
        primaryColor: t.colors.primary,
        primaryColorHover: t.colors.primaryHover,
        primaryColorPressed: t.colors.primaryPressed,
        primaryColorSuppl: t.colors.primaryHover,
        successColor: t.colors.success,
        warningColor: t.colors.warning,
        errorColor: t.colors.error,
        infoColor: t.colors.info,
        borderRadius: t.radius.medium,
        borderRadiusSmall: t.radius.small,
        boxShadow2: t.shadow.overlay,
        heightSmall: height,
        heightMedium: density === 'compact' ? '32px' : '36px',
      },
    },
  }
}
